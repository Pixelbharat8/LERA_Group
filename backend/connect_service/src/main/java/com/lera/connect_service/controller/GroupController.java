package com.lera.connect_service.controller;

import com.lera.connect_service.entity.ChatGroup;
import com.lera.connect_service.repository.ChatGroupRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class GroupController {

    private final ChatGroupRepository chatGroupRepository;

    private Map<String, Object> toResponse(ChatGroup group) {
        Map<String, Object> groupMap = new HashMap<>();
        groupMap.put("id", group.getId().toString());
        groupMap.put("name", group.getName());
        groupMap.put("description", group.getDescription());
        groupMap.put("avatarUrl", group.getAvatarUrl());
        groupMap.put("createdBy", group.getCreatedBy() != null ? group.getCreatedBy().toString() : null);
        groupMap.put("memberIds", group.getMemberIds() != null
                ? group.getMemberIds().stream().map(UUID::toString).toList() : List.of());
        groupMap.put("adminIds", group.getAdminIds() != null
                ? group.getAdminIds().stream().map(UUID::toString).toList() : List.of());
        groupMap.put("memberCount", group.getMemberIds() != null ? group.getMemberIds().size() : 0);
        groupMap.put("createdAt", group.getCreatedAt() != null ? group.getCreatedAt().toString() : null);
        return groupMap;
    }

    private ChatGroup requireGroup(UUID groupId) {
        return chatGroupRepository.findById(groupId)
                .filter(g -> Boolean.TRUE.equals(g.getIsActive()))
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Group not found"));
    }

    @GetMapping
    public ResponseEntity<?> getAllGroups(@AuthenticationPrincipal AuthUser authUser) {
        UUID self = ConnectSecurity.requireUserId(authUser);
        List<ChatGroup> groups = ConnectSecurity.isOrgWide(authUser)
                ? chatGroupRepository.findByIsActiveTrue()
                : chatGroupRepository.findByMemberId(self);
        return ResponseEntity.ok(groups.stream().map(this::toResponse).toList());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getGroupsForUser(
            @PathVariable String userId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID eff = ConnectSecurity.effectiveGroupUserId(authUser, UUID.fromString(userId));
        List<ChatGroup> groups = chatGroupRepository.findByMemberId(eff);
        return ResponseEntity.ok(groups.stream().map(this::toResponse).toList());
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<?> getGroup(
            @PathVariable String groupId,
            @AuthenticationPrincipal AuthUser authUser) {
        ChatGroup group = requireGroup(UUID.fromString(groupId));
        ConnectSecurity.assertGroupMember(authUser, group);
        return ResponseEntity.ok(toResponse(group));
    }

    @PostMapping
    public ResponseEntity<?> createGroup(
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID self = ConnectSecurity.requireUserId(authUser);
        ChatGroup group = new ChatGroup();
        group.setName((String) request.get("name"));
        group.setDescription((String) request.get("description"));
        group.setAvatarUrl((String) request.get("avatarUrl"));
        group.setCreatedBy(self);
        if (request.get("createdBy") != null) {
            ConnectSecurity.assertActorIsSelf(authUser, request.get("createdBy").toString());
        }

        List<UUID> memberIds = new ArrayList<>();
        if (request.get("memberIds") != null) {
            @SuppressWarnings("unchecked")
            List<String> memberIdStrings = (List<String>) request.get("memberIds");
            for (String memberId : memberIdStrings) {
                memberIds.add(UUID.fromString(memberId));
            }
        }
        if (!memberIds.contains(self)) {
            memberIds.add(self);
        }
        group.setMemberIds(memberIds);
        group.setAdminIds(new ArrayList<>(List.of(self)));
        group.setIsActive(true);
        group.setCreatedAt(LocalDateTime.now());

        ChatGroup saved = chatGroupRepository.save(group);
        Map<String, Object> result = toResponse(saved);
        result.put("message", "Group created successfully");
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{groupId}")
    public ResponseEntity<?> updateGroup(
            @PathVariable String groupId,
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        ChatGroup group = requireGroup(UUID.fromString(groupId));
        ConnectSecurity.assertGroupAdmin(authUser, group);

        if (request.containsKey("name")) {
            group.setName((String) request.get("name"));
        }
        if (request.containsKey("description")) {
            group.setDescription((String) request.get("description"));
        }
        if (request.containsKey("avatarUrl")) {
            group.setAvatarUrl((String) request.get("avatarUrl"));
        }
        group.setUpdatedAt(LocalDateTime.now());
        ChatGroup saved = chatGroupRepository.save(group);
        return ResponseEntity.ok(Map.of(
                "id", saved.getId().toString(),
                "name", saved.getName(),
                "message", "Group updated successfully"));
    }

    @PostMapping("/{groupId}/members")
    public ResponseEntity<?> addMember(
            @PathVariable String groupId,
            @Valid @RequestBody Map<String, String> request,
            @AuthenticationPrincipal AuthUser authUser) {
        ChatGroup group = requireGroup(UUID.fromString(groupId));
        ConnectSecurity.assertGroupAdmin(authUser, group);
        UUID memberId = UUID.fromString(request.get("memberId"));

        List<UUID> memberIds = group.getMemberIds() != null
                ? new ArrayList<>(group.getMemberIds()) : new ArrayList<>();
        if (!memberIds.contains(memberId)) {
            memberIds.add(memberId);
            group.setMemberIds(memberIds);
            group.setUpdatedAt(LocalDateTime.now());
            chatGroupRepository.save(group);
        }
        return ResponseEntity.ok(Map.of("message", "Member added successfully"));
    }

    @DeleteMapping("/{groupId}/members/{memberId}")
    public ResponseEntity<?> removeMember(
            @PathVariable String groupId,
            @PathVariable String memberId,
            @AuthenticationPrincipal AuthUser authUser) {
        ChatGroup group = requireGroup(UUID.fromString(groupId));
        UUID memberUuid = UUID.fromString(memberId);
        UUID self = ConnectSecurity.requireUserId(authUser);
        if (!self.equals(memberUuid)) {
            ConnectSecurity.assertGroupAdmin(authUser, group);
        } else {
            ConnectSecurity.assertGroupMember(authUser, group);
        }

        List<UUID> memberIds = group.getMemberIds() != null
                ? new ArrayList<>(group.getMemberIds()) : new ArrayList<>();
        memberIds.remove(memberUuid);
        group.setMemberIds(memberIds);
        group.setUpdatedAt(LocalDateTime.now());
        chatGroupRepository.save(group);
        return ResponseEntity.ok(Map.of("message", "Member removed successfully"));
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<?> deleteGroup(
            @PathVariable String groupId,
            @AuthenticationPrincipal AuthUser authUser) {
        ChatGroup group = requireGroup(UUID.fromString(groupId));
        ConnectSecurity.assertGroupAdmin(authUser, group);
        group.setIsActive(false);
        group.setUpdatedAt(LocalDateTime.now());
        chatGroupRepository.save(group);
        return ResponseEntity.ok(Map.of("message", "Group deleted successfully"));
    }
}
