package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.entity.ClassSession;
import com.lera.academy_service.repository.ClassRepository;
import com.lera.academy_service.repository.ClassSessionRepository;
import com.lera.academy_service.service.ClassRosterNotificationService;
import com.lera.academy_service.service.ClassSessionPayrollBridgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/class-sessions")
@RequiredArgsConstructor
public class ClassSessionController {
    
    private final ClassSessionRepository classSessionRepository;
    private final ClassRepository classRepository;
    private final ClassRosterNotificationService classRosterNotificationService;
    private final ClassSessionPayrollBridgeService classSessionPayrollBridgeService;
    private final AcademyAuthorizationService authz;
    private final com.lera.academy_service.client.NotificationClient notificationClient;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<List<ClassSession>> getAllSessions(
            Pageable pageable,
            @RequestParam(required = false) UUID classId,
            @RequestParam(required = false) UUID centerId) {
        if (classId != null) {
            authz.assertCanViewClassRoster(classId);
            return ResponseEntity.ok(classSessionRepository.findByClassId(classId));
        }
        if (centerId != null) {
            authz.assertStaff();
            UUID effCenter = authz.effectiveListCenterId(centerId);
            List<ClassSession> sessions = new ArrayList<>();
            for (ClassEntity clazz : classRepository.findByCenterId(effCenter)) {
                sessions.addAll(classSessionRepository.findByClassId(clazz.getId()));
            }
            return ResponseEntity.ok(sessions);
        }
        authz.assertStaff();
        if (!authz.isOrgWide()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "classId or centerId is required for session list queries unless you have an org-wide role");
        }
        return ResponseEntity.ok(classSessionRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ClassSession> getSessionById(@PathVariable UUID id) {
        authz.assertCanViewClassSession(id);
        return classSessionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/class/{classId}")
    public ResponseEntity<List<ClassSession>> getSessionsByClass(@PathVariable UUID classId) {
        authz.assertCanViewClassRoster(classId);
        return ResponseEntity.ok(classSessionRepository.findByClassId(classId));
    }
    
    @GetMapping("/class/{classId}/date/{date}")
    public ResponseEntity<List<ClassSession>> getSessionsByClassAndDate(
            @PathVariable UUID classId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        authz.assertCanViewClassRoster(classId);
        return ResponseEntity.ok(classSessionRepository.findByClassIdAndSessionDate(classId, date));
    }

    /** All sessions on a date (centre-scoped) — the substitution day view. */
    @GetMapping("/date/{date}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<List<ClassSession>> getSessionsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) UUID centerId) {
        List<ClassSession> all = classSessionRepository.findBySessionDate(date);
        if (authz.isOrgWide() && centerId == null) {
            return ResponseEntity.ok(all);
        }
        UUID eff = authz.effectiveListCenterId(centerId);
        java.util.Set<UUID> centerClassIds = classRepository.findByCenterId(eff).stream()
                .map(ClassEntity::getId).collect(java.util.stream.Collectors.toSet());
        return ResponseEntity.ok(all.stream()
                .filter(s -> centerClassIds.contains(s.getClassId())).toList());
    }

    /** Assign a substitute (cover) teacher to a session and notify them. */
    @PostMapping("/{id}/assign-substitute")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<ClassSession> assignSubstitute(@PathVariable UUID id,
                                                         @RequestBody java.util.Map<String, Object> body) {
        authz.assertCanViewClassSession(id);
        if (body.get("substituteTeacherId") == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "substituteTeacherId is required");
        }
        UUID subId;
        try { subId = UUID.fromString(body.get("substituteTeacherId").toString()); }
        catch (IllegalArgumentException e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid substituteTeacherId"); }
        String reason = body.get("reason") != null ? body.get("reason").toString() : null;
        return classSessionRepository.findById(id).map(session -> {
            session.setSubstituteTeacherId(subId);
            if (reason != null && !reason.isBlank()) {
                String note = "[Substitute] " + reason;
                session.setNotes(session.getNotes() == null || session.getNotes().isBlank()
                        ? note : session.getNotes() + "\n" + note);
            }
            ClassSession saved = classSessionRepository.save(session);
            try {
                notificationClient.triggerNotification(java.util.Map.of(
                        "notificationType", "TASK_ASSIGNED",
                        "userId", subId,
                        "title", "Substitute teaching assignment",
                        "message", "You've been asked to cover \"" + saved.getTopic() + "\" on "
                                + saved.getSessionDate() + (reason != null && !reason.isBlank() ? " — " + reason : ""),
                        "referenceId", saved.getId()));
            } catch (Exception ignored) { /* non-blocking */ }
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Remove the substitute from a session (original teacher resumes). */
    @PostMapping("/{id}/clear-substitute")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<ClassSession> clearSubstitute(@PathVariable UUID id) {
        authz.assertCanViewClassSession(id);
        return classSessionRepository.findById(id).map(session -> {
            session.setSubstituteTeacherId(null);
            return ResponseEntity.ok(classSessionRepository.save(session));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Session IDs on a date that need cover: the assigned teacher is on APPROVED leave that day
     * and no substitute is assigned yet. Reads teacher_staff_leaves on the shared DB.
     */
    @GetMapping("/needs-cover")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<List<UUID>> needsCover(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) UUID centerId) {
        UUID eff = (authz.isOrgWide() && centerId == null) ? null : authz.effectiveListCenterId(centerId);
        StringBuilder sql = new StringBuilder(
                "SELECT DISTINCT cs.id FROM class_sessions cs "
              + "JOIN teachers t ON t.id = cs.teacher_id "
              + "JOIN teacher_staff_leaves l ON l.user_id = t.user_id "
              + "WHERE cs.session_date = ? AND cs.substitute_teacher_id IS NULL "
              + "AND l.status = 'APPROVED' AND l.leave_date <= cs.session_date "
              + "AND COALESCE(l.end_date, l.leave_date) >= cs.session_date ");
        List<Object> args = new java.util.ArrayList<>();
        args.add(date);
        if (eff != null) {
            sql.append("AND cs.class_id IN (SELECT id FROM classes WHERE center_id = ?) ");
            args.add(eff);
        }
        try {
            List<UUID> ids = jdbcTemplate.query(sql.toString(),
                    (rs, i) -> (UUID) rs.getObject("id"), args.toArray());
            return ResponseEntity.ok(ids);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of()); // degrade gracefully if leave table differs
        }
    }

    @PostMapping
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<ClassSession> createSession(@Valid @RequestBody ClassSession session) {
        ClassSession saved = classSessionRepository.save(session);
        classSessionPayrollBridgeService.syncIfCompleted(saved);
        return ResponseEntity.ok(saved);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<ClassSession> updateSession(@PathVariable UUID id, @Valid @RequestBody ClassSession details) {
        return classSessionRepository.findById(id).map(session -> {
            String oldStatus = session.getStatus();
            if (details.getSessionDate() != null) session.setSessionDate(details.getSessionDate());
            if (details.getStartTime() != null) session.setStartTime(details.getStartTime());
            if (details.getEndTime() != null) session.setEndTime(details.getEndTime());
            if (details.getTopic() != null) session.setTopic(details.getTopic());
            if (details.getObjectives() != null) session.setObjectives(details.getObjectives());
            if (details.getRoomNumber() != null) session.setRoomNumber(details.getRoomNumber());
            if (details.getStatus() != null) session.setStatus(details.getStatus());
            if (details.getNotes() != null) session.setNotes(details.getNotes());
            ClassSession saved = classSessionRepository.save(session);
            if (saved.getStatus() != null && saved.getStatus().equalsIgnoreCase("CANCELLED")
                    && (oldStatus == null || !oldStatus.equalsIgnoreCase("CANCELLED"))) {
                ClassEntity cls = classRepository.findById(saved.getClassId()).orElse(null);
                if (cls != null) {
                    try {
                        classRosterNotificationService.notifySessionCancelled(cls, saved, details.getNotes());
                    } catch (Exception ignored) {
                        // Non-blocking
                    }
                }
            }
            if (saved.getStatus() != null
                    && saved.getStatus().equalsIgnoreCase("COMPLETED")
                    && (oldStatus == null || !oldStatus.equalsIgnoreCase("COMPLETED"))) {
                try {
                    classSessionPayrollBridgeService.syncIfCompleted(saved);
                } catch (Exception ignored) {
                    // Non-blocking payroll sync
                }
            }
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<Void> deleteSession(@PathVariable UUID id) {
        if (classSessionRepository.existsById(id)) {
            classSessionRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
