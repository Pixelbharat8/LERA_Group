package com.lera.connect_service.controller;

import com.lera.connect_service.entity.ClassGroupChat;
import com.lera.connect_service.entity.ChatGroup;
import com.lera.connect_service.repository.ClassGroupChatRepository;
import com.lera.connect_service.repository.ChatGroupRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/chat/class-groups")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ClassGroupChatController {

    private final ClassGroupChatRepository classGroupChatRepository;
    private final ChatGroupRepository chatGroupRepository;

    private ClassGroupChat requireClassGroup(UUID id) {
        return classGroupChatRepository.findById(id)
                .filter(c -> Boolean.TRUE.equals(c.getIsActive()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private void assertCanAccessClassGroup(AuthUser user, ClassGroupChat classGroup) {
        if (ConnectSecurity.isOrgWide(user) || ConnectSecurity.isAcademyStaff(user)) {
            return;
        }
        ChatGroup chatGroup = chatGroupRepository.findById(classGroup.getGroupId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        ConnectSecurity.assertGroupMember(user, chatGroup);
    }

    @PostMapping("/auto-create")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER')")
    public ResponseEntity<?> autoCreateClassGroup(
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID classId = UUID.fromString((String) request.get("classId"));
        UUID academyId = UUID.fromString((String) request.get("academyId"));
        if (!ConnectSecurity.isOrgWide(authUser)) {
            UUID jwtCenter = authUser.getCenterId();
            if (jwtCenter != null && !jwtCenter.equals(academyId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
        }

        String className = (String) request.get("className");
        String gradeLevel = (String) request.getOrDefault("gradeLevel", "");
        String section = (String) request.getOrDefault("section", "");
        String academicYear = (String) request.getOrDefault("academicYear", "2025-2026");

        if (classGroupChatRepository.existsByClassId(classId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Class group already exists"));
        }

        ChatGroup chatGroup = ChatGroup.builder()
                .name(className + " Class Group")
                .description("Official group chat for " + className + " - " + gradeLevel + " " + section)
                .createdBy(ConnectSecurity.requireUserId(authUser))
                .memberIds(new ArrayList<>())
                .adminIds(new ArrayList<>(List.of(ConnectSecurity.requireUserId(authUser))))
                .isActive(true)
                .build();
        chatGroup = chatGroupRepository.save(chatGroup);

        ClassGroupChat classGroupChat = ClassGroupChat.builder()
                .classId(classId)
                .academyId(academyId)
                .groupId(chatGroup.getId())
                .className(className)
                .gradeLevel(gradeLevel)
                .section(section)
                .academicYear(academicYear)
                .groupType("CLASS")
                .includeParents(true)
                .includeStudents(true)
                .autoSyncMembers(true)
                .isActive(true)
                .build();

        classGroupChat = classGroupChatRepository.save(classGroupChat);

        return ResponseEntity.ok(Map.of(
                "classGroupChat", classGroupChat,
                "chatGroup", chatGroup,
                "message", "Class group created successfully"));
    }

    @GetMapping("/academy/{academyId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','TEACHER','STAFF')")
    public ResponseEntity<?> getByAcademy(
            @PathVariable UUID academyId,
            @AuthenticationPrincipal AuthUser authUser) {
        if (!ConnectSecurity.isOrgWide(authUser)) {
            UUID jwtCenter = authUser.getCenterId();
            if (jwtCenter != null && !jwtCenter.equals(academyId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
        }
        List<ClassGroupChat> groups = classGroupChatRepository.findByAcademyIdAndIsActiveTrue(academyId);
        if (!ConnectSecurity.isOrgWide(authUser) && !ConnectSecurity.isAcademyStaff(authUser)) {
            UUID self = ConnectSecurity.requireUserId(authUser);
            groups = groups.stream().filter(cgc -> {
                return chatGroupRepository.findById(cgc.getGroupId())
                        .map(g -> g.getMemberIds() != null && g.getMemberIds().contains(self))
                        .orElse(false);
            }).toList();
        }
        return ResponseEntity.ok(groups);
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<?> getByClass(
            @PathVariable UUID classId,
            @AuthenticationPrincipal AuthUser authUser) {
        return classGroupChatRepository.findByClassId(classId)
                .map(cgc -> {
                    assertCanAccessClassGroup(authUser, cgc);
                    return ResponseEntity.ok(cgc);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{groupId}/members")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','TEACHER','STAFF')")
    public ResponseEntity<?> addMembers(
            @PathVariable UUID groupId,
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        ClassGroupChat classGroup = requireClassGroup(groupId);
        assertCanAccessClassGroup(authUser, classGroup);

        @SuppressWarnings("unchecked")
        List<String> memberIdStrings = (List<String>) request.get("memberIds");
        List<UUID> memberIds = memberIdStrings.stream().map(UUID::fromString).toList();
        String memberType = (String) request.getOrDefault("memberType", "STUDENT");

        ChatGroup chatGroup = chatGroupRepository.findById(classGroup.getGroupId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        List<UUID> existingMembers = new ArrayList<>(chatGroup.getMemberIds() != null
                ? chatGroup.getMemberIds() : List.of());
        for (UUID memberId : memberIds) {
            if (!existingMembers.contains(memberId)) {
                existingMembers.add(memberId);
            }
        }
        chatGroup.setMemberIds(existingMembers);
        chatGroup.setUpdatedAt(LocalDateTime.now());
        chatGroupRepository.save(chatGroup);

        return ResponseEntity.ok(Map.of(
                "message", "Members added successfully",
                "addedCount", memberIds.size(),
                "memberType", memberType));
    }

    @PostMapping("/{groupId}/sync")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER')")
    public ResponseEntity<?> syncMembers(
            @PathVariable UUID groupId,
            @AuthenticationPrincipal AuthUser authUser) {
        return classGroupChatRepository.findById(groupId)
                .map(classGroup -> {
                    assertCanAccessClassGroup(authUser, classGroup);
                    classGroup.setUpdatedAt(LocalDateTime.now());
                    classGroupChatRepository.save(classGroup);
                    return ResponseEntity.ok(Map.of(
                            "message", "Members synced successfully",
                            "classId", classGroup.getClassId()));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{groupId}/settings")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER')")
    public ResponseEntity<?> updateSettings(
            @PathVariable UUID groupId,
            @Valid @RequestBody Map<String, Object> settings,
            @AuthenticationPrincipal AuthUser authUser) {
        return classGroupChatRepository.findById(groupId)
                .map(classGroup -> {
                    assertCanAccessClassGroup(authUser, classGroup);
                    if (settings.containsKey("includeParents")) {
                        classGroup.setIncludeParents((Boolean) settings.get("includeParents"));
                    }
                    if (settings.containsKey("includeStudents")) {
                        classGroup.setIncludeStudents((Boolean) settings.get("includeStudents"));
                    }
                    if (settings.containsKey("autoSyncMembers")) {
                        classGroup.setAutoSyncMembers((Boolean) settings.get("autoSyncMembers"));
                    }
                    classGroup.setUpdatedAt(LocalDateTime.now());
                    return ResponseEntity.ok(classGroupChatRepository.save(classGroup));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
