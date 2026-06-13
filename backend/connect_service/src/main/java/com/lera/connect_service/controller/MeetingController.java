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

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat/meetings")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class MeetingController {

    private final ParentTeacherMeetingRepository meetingRepository;

    @PostMapping
    public ResponseEntity<?> scheduleMeeting(
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            UUID parentId = UUID.fromString((String) request.get("parentId"));
            UUID teacherId = UUID.fromString((String) request.get("teacherId"));
            UUID self = ConnectSecurity.requireUserId(authUser);
            if (!ConnectSecurity.isOrgWide(authUser)
                    && !self.equals(parentId)
                    && !self.equals(teacherId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }

            ParentTeacherMeeting meeting = ParentTeacherMeeting.builder()
                .teacherId(teacherId)
                .parentId(parentId)
                .studentId(UUID.fromString((String) request.get("studentId")))
                .academyId(request.get("academyId") != null ? UUID.fromString((String) request.get("academyId")) : null)
                .conversationId(request.get("conversationId") != null ? UUID.fromString((String) request.get("conversationId")) : null)
                .meetingType((String) request.getOrDefault("meetingType", "IN_PERSON"))
                .meetingLink((String) request.get("meetingLink"))
                .location((String) request.get("location"))
                .scheduledAt(LocalDateTime.parse((String) request.get("scheduledAt")))
                .durationMinutes(request.get("durationMinutes") != null ? ((Number) request.get("durationMinutes")).intValue() : 30)
                .status("PENDING")
                .subject((String) request.get("subject"))
                .agenda((String) request.get("agenda"))
                .requestedBy((String) request.getOrDefault("requestedBy", "TEACHER"))
                .build();

            meeting = meetingRepository.save(meeting);

            return ResponseEntity.ok(Map.of(
                "meeting", meeting,
                "message", "Meeting scheduled successfully"
            ));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    @GetMapping("/teacher/{teacherId}/upcoming")
    public ResponseEntity<?> getTeacherUpcoming(
            @PathVariable UUID teacherId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID eff = ConnectSecurity.effectiveMeetingParticipantId(authUser, teacherId);
        List<ParentTeacherMeeting> meetings = meetingRepository.findUpcomingByTeacher(eff, LocalDateTime.now());
        return ResponseEntity.ok(meetings);
    }

    @GetMapping("/parent/{parentId}/upcoming")
    public ResponseEntity<?> getParentUpcoming(
            @PathVariable UUID parentId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID eff = ConnectSecurity.effectiveMeetingParticipantId(authUser, parentId);
        List<ParentTeacherMeeting> meetings = meetingRepository.findUpcomingByParent(eff, LocalDateTime.now());
        return ResponseEntity.ok(meetings);
    }

    @GetMapping("/teacher/{teacherId}/schedule")
    public ResponseEntity<?> getTeacherSchedule(
            @PathVariable UUID teacherId,
            @RequestParam String startDate,
            @RequestParam String endDate,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID eff = ConnectSecurity.effectiveMeetingParticipantId(authUser, teacherId);
        LocalDateTime start = LocalDateTime.parse(startDate);
        LocalDateTime end = LocalDateTime.parse(endDate);
        List<ParentTeacherMeeting> meetings = meetingRepository.findTeacherSchedule(eff, start, end);
        return ResponseEntity.ok(meetings);
    }

    @PutMapping("/{meetingId}/confirm")
    public ResponseEntity<?> confirmMeeting(
            @PathVariable UUID meetingId,
            @AuthenticationPrincipal AuthUser authUser) {
        return meetingRepository.findById(meetingId)
            .map(meeting -> {
                ConnectSecurity.assertCanAccessMeeting(authUser, meeting);
                meeting.setStatus("CONFIRMED");
                meeting.setUpdatedAt(LocalDateTime.now());
                return ResponseEntity.ok(meetingRepository.save(meeting));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{meetingId}/cancel")
    public ResponseEntity<?> cancelMeeting(
            @PathVariable UUID meetingId,
            @Valid @RequestBody(required = false) Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        return meetingRepository.findById(meetingId)
            .map(meeting -> {
                ConnectSecurity.assertCanAccessMeeting(authUser, meeting);
                meeting.setStatus("CANCELLED");
                meeting.setUpdatedAt(LocalDateTime.now());
                return ResponseEntity.ok(meetingRepository.save(meeting));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{meetingId}/reschedule")
    public ResponseEntity<?> rescheduleMeeting(
            @PathVariable UUID meetingId,
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        return meetingRepository.findById(meetingId)
            .map(meeting -> {
                ConnectSecurity.assertCanAccessMeeting(authUser, meeting);
                meeting.setScheduledAt(LocalDateTime.parse((String) request.get("scheduledAt")));
                if (request.containsKey("durationMinutes")) {
                    meeting.setDurationMinutes(((Number) request.get("durationMinutes")).intValue());
                }
                meeting.setStatus("PENDING");
                meeting.setUpdatedAt(LocalDateTime.now());
                return ResponseEntity.ok(meetingRepository.save(meeting));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{meetingId}/complete")
    public ResponseEntity<?> completeMeeting(
            @PathVariable UUID meetingId,
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        return meetingRepository.findById(meetingId)
            .map(meeting -> {
                ConnectSecurity.assertCanAccessMeeting(authUser, meeting);
                meeting.setStatus("COMPLETED");
                meeting.setTeacherNotes((String) request.get("teacherNotes"));
                meeting.setOutcome((String) request.get("outcome"));
                meeting.setFollowUpRequired((Boolean) request.getOrDefault("followUpRequired", false));
                if (request.containsKey("followUpDate")) {
                    meeting.setFollowUpDate(LocalDateTime.parse((String) request.get("followUpDate")));
                }
                meeting.setUpdatedAt(LocalDateTime.now());
                return ResponseEntity.ok(meetingRepository.save(meeting));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/follow-ups")
    public ResponseEntity<?> getPendingFollowUps(@AuthenticationPrincipal AuthUser authUser) {
        List<ParentTeacherMeeting> meetings = meetingRepository.findPendingFollowUps(LocalDateTime.now());
        if (!ConnectSecurity.isOrgWide(authUser)) {
            UUID self = ConnectSecurity.requireUserId(authUser);
            meetings = meetings.stream()
                    .filter(m -> self.equals(m.getParentId())
                            || self.equals(m.getTeacherId())
                            || self.equals(m.getStudentId()))
                    .collect(Collectors.toList());
        }
        return ResponseEntity.ok(meetings);
    }

    @GetMapping("/teacher/{teacherId}/available-slots")
    public ResponseEntity<?> getAvailableSlots(
            @PathVariable UUID teacherId,
            @RequestParam String date,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.effectiveMeetingParticipantId(authUser, teacherId);
        List<Map<String, Object>> slots = new ArrayList<>();
        LocalDateTime baseDate = LocalDateTime.parse(date + "T09:00:00");

        for (int i = 0; i < 16; i++) {
            LocalDateTime slotTime = baseDate.plusMinutes(i * 30);
            if (slotTime.getHour() >= 9 && slotTime.getHour() < 17) {
                slots.add(Map.of(
                    "startTime", slotTime.toString(),
                    "endTime", slotTime.plusMinutes(30).toString(),
                    "available", true
                ));
            }
        }

        return ResponseEntity.ok(slots);
    }
}
