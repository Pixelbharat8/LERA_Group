package com.lera.connect_service.controller;

import com.lera.connect_service.entity.ParentTeacherMeeting;
import com.lera.connect_service.repository.ParentTeacherMeetingRepository;
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

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/parent-teacher-meetings")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ParentTeacherMeetingController {

    private final ParentTeacherMeetingRepository parentTeacherMeetingRepository;

    @GetMapping
    public ResponseEntity<List<ParentTeacherMeeting>> getAll(
            @RequestParam(required = false) UUID parentId,
            @RequestParam(required = false) UUID teacherId,
            @RequestParam(required = false) UUID studentId,
            @RequestParam(required = false) UUID participantId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID self = ConnectSecurity.requireUserId(authUser);
        if (parentId != null) {
            UUID eff = ConnectSecurity.effectiveMeetingParticipantId(authUser, parentId);
            return ResponseEntity.ok(parentTeacherMeetingRepository.findByParentId(eff));
        }
        if (teacherId != null) {
            UUID eff = ConnectSecurity.effectiveMeetingParticipantId(authUser, teacherId);
            return ResponseEntity.ok(parentTeacherMeetingRepository.findByTeacherId(eff));
        }
        if (studentId != null) {
            UUID eff = ConnectSecurity.effectiveMeetingParticipantId(authUser, studentId);
            return ResponseEntity.ok(parentTeacherMeetingRepository.findByStudentId(eff));
        }
        if (participantId != null) {
            UUID eff = ConnectSecurity.effectiveMeetingParticipantId(authUser, participantId);
            Set<UUID> seen = new HashSet<>();
            List<ParentTeacherMeeting> merged = new ArrayList<>();
            for (ParentTeacherMeeting m : parentTeacherMeetingRepository.findByParentId(eff)) {
                if (seen.add(m.getId())) merged.add(m);
            }
            for (ParentTeacherMeeting m : parentTeacherMeetingRepository.findByTeacherId(eff)) {
                if (seen.add(m.getId())) merged.add(m);
            }
            for (ParentTeacherMeeting m : parentTeacherMeetingRepository.findByStudentId(eff)) {
                if (seen.add(m.getId())) merged.add(m);
            }
            return ResponseEntity.ok(merged);
        }
        if (ConnectSecurity.isOrgWide(authUser)) {
            return ResponseEntity.ok(parentTeacherMeetingRepository.findAll());
        }
        Set<UUID> seen = new HashSet<>();
        List<ParentTeacherMeeting> merged = new ArrayList<>();
        for (ParentTeacherMeeting m : parentTeacherMeetingRepository.findByParentId(self)) {
            if (seen.add(m.getId())) merged.add(m);
        }
        for (ParentTeacherMeeting m : parentTeacherMeetingRepository.findByTeacherId(self)) {
            if (seen.add(m.getId())) merged.add(m);
        }
        for (ParentTeacherMeeting m : parentTeacherMeetingRepository.findByStudentId(self)) {
            if (seen.add(m.getId())) merged.add(m);
        }
        return ResponseEntity.ok(merged);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ParentTeacherMeeting> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return parentTeacherMeetingRepository.findById(id)
                .map(m -> {
                    ConnectSecurity.assertCanAccessMeeting(authUser, m);
                    return ResponseEntity.ok(m);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<ParentTeacherMeeting>> getByTeacher(
            @PathVariable UUID teacherId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID eff = ConnectSecurity.effectiveMeetingParticipantId(authUser, teacherId);
        return ResponseEntity.ok(parentTeacherMeetingRepository.findByTeacherId(eff));
    }

    @GetMapping("/parent/{parentId}")
    public ResponseEntity<List<ParentTeacherMeeting>> getByParent(
            @PathVariable UUID parentId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID eff = ConnectSecurity.effectiveMeetingParticipantId(authUser, parentId);
        return ResponseEntity.ok(parentTeacherMeetingRepository.findByParentId(eff));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','TEACHER','STAFF')")
    public ResponseEntity<List<ParentTeacherMeeting>> getByStatus(
            @PathVariable String status,
            @AuthenticationPrincipal AuthUser authUser) {
        if (!ConnectSecurity.isOrgWide(authUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Status-wide meeting queries require an org-wide role; query by participant instead");
        }
        return ResponseEntity.ok(parentTeacherMeetingRepository.findByStatus(status));
    }

    @PostMapping
    public ResponseEntity<ParentTeacherMeeting> create(
            @Valid @RequestBody ParentTeacherMeeting meeting,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID self = ConnectSecurity.requireUserId(authUser);
        if (!ConnectSecurity.isOrgWide(authUser)
                && !self.equals(meeting.getParentId())
                && !self.equals(meeting.getTeacherId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot schedule a meeting for other users");
        }
        return ResponseEntity.ok(parentTeacherMeetingRepository.save(meeting));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ParentTeacherMeeting> update(
            @PathVariable UUID id,
            @Valid @RequestBody ParentTeacherMeeting details,
            @AuthenticationPrincipal AuthUser authUser) {
        return parentTeacherMeetingRepository.findById(id).map(meeting -> {
            ConnectSecurity.assertCanAccessMeeting(authUser, meeting);
            if (details.getStatus() != null) meeting.setStatus(details.getStatus());
            if (details.getTeacherNotes() != null) meeting.setTeacherNotes(details.getTeacherNotes());
            return ResponseEntity.ok(parentTeacherMeetingRepository.save(meeting));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return parentTeacherMeetingRepository.findById(id)
                .map(m -> {
                    ConnectSecurity.assertCanAccessMeeting(authUser, m);
                    parentTeacherMeetingRepository.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
