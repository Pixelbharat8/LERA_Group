package com.lera.connect_service.controller;

import com.lera.connect_service.entity.ParentTeacherMeeting;
import com.lera.connect_service.repository.ParentTeacherMeetingRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Top-level {@code /api/meetings} alias for the parent-teacher meeting feature.
 */
@RestController
@RequestMapping("/api/meetings")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class MeetingsAliasController {

    private final ParentTeacherMeetingRepository meetingRepository;

    @GetMapping
    public ResponseEntity<List<ParentTeacherMeeting>> listMeetings(
            @RequestParam(required = false) UUID parentId,
            @RequestParam(required = false) UUID teacherId,
            @RequestParam(required = false) UUID studentId,
            @RequestParam(required = false) UUID participantId,
            @RequestParam(required = false, defaultValue = "false") boolean upcoming,
            @AuthenticationPrincipal AuthUser authUser) {

        LocalDateTime now = LocalDateTime.now();
        UUID self = ConnectSecurity.requireUserId(authUser);

        if (parentId != null) {
            UUID eff = ConnectSecurity.effectiveMeetingParticipantId(authUser, parentId);
            return ResponseEntity.ok(upcoming
                    ? meetingRepository.findUpcomingByParent(eff, now)
                    : meetingRepository.findByParentId(eff));
        }
        if (teacherId != null) {
            UUID eff = ConnectSecurity.effectiveMeetingParticipantId(authUser, teacherId);
            return ResponseEntity.ok(upcoming
                    ? meetingRepository.findUpcomingByTeacher(eff, now)
                    : meetingRepository.findByTeacherId(eff));
        }
        if (studentId != null) {
            UUID eff = ConnectSecurity.effectiveMeetingParticipantId(authUser, studentId);
            return ResponseEntity.ok(meetingRepository.findByStudentId(eff));
        }
        if (participantId != null) {
            UUID eff = ConnectSecurity.effectiveMeetingParticipantId(authUser, participantId);
            Set<UUID> seen = new HashSet<>();
            List<ParentTeacherMeeting> merged = new ArrayList<>();
            for (ParentTeacherMeeting m : meetingRepository.findByParentId(eff)) {
                if (seen.add(m.getId())) merged.add(m);
            }
            for (ParentTeacherMeeting m : meetingRepository.findByTeacherId(eff)) {
                if (seen.add(m.getId())) merged.add(m);
            }
            for (ParentTeacherMeeting m : meetingRepository.findByStudentId(eff)) {
                if (seen.add(m.getId())) merged.add(m);
            }
            return ResponseEntity.ok(merged);
        }
        if (ConnectSecurity.isOrgWide(authUser)) {
            return ResponseEntity.ok(meetingRepository.findAll());
        }
        Set<UUID> seen = new HashSet<>();
        List<ParentTeacherMeeting> merged = new ArrayList<>();
        for (ParentTeacherMeeting m : meetingRepository.findByParentId(self)) {
            if (seen.add(m.getId())) merged.add(m);
        }
        for (ParentTeacherMeeting m : meetingRepository.findByTeacherId(self)) {
            if (seen.add(m.getId())) merged.add(m);
        }
        for (ParentTeacherMeeting m : meetingRepository.findByStudentId(self)) {
            if (seen.add(m.getId())) merged.add(m);
        }
        return ResponseEntity.ok(merged);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ParentTeacherMeeting> getMeeting(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return meetingRepository.findById(id)
                .map(m -> {
                    ConnectSecurity.assertCanAccessMeeting(authUser, m);
                    return ResponseEntity.ok(m);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
