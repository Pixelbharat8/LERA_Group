package com.lera.academy_service.controller;

import com.lera.academy_service.entity.SessionAttendance;
import com.lera.academy_service.repository.SessionAttendanceRepository;
import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.service.SessionAttendanceService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/session-attendance")
@RequiredArgsConstructor
public class SessionAttendanceController {

    private final SessionAttendanceRepository sessionAttendanceRepository;
    private final SessionAttendanceService sessionAttendanceService;
    private final AcademyAuthorizationService authz;

    @GetMapping
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<List<SessionAttendance>> getAllAttendance(Pageable pageable) {
        return ResponseEntity.ok(sessionAttendanceRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<SessionAttendance> getAttendanceById(@PathVariable UUID id) {
        return sessionAttendanceRepository
                .findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<SessionAttendance>> getAttendanceBySession(@PathVariable UUID sessionId) {
        authz.assertCanViewClassSession(sessionId);
        return ResponseEntity.ok(sessionAttendanceRepository.findBySessionId(sessionId));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<SessionAttendance>> getAttendanceByStudent(@PathVariable UUID studentId) {
        authz.assertCanViewStudent(studentId);
        return ResponseEntity.ok(sessionAttendanceRepository.findByStudentId(studentId));
    }

    @GetMapping("/session/{sessionId}/student/{studentId}")
    public ResponseEntity<SessionAttendance> getAttendanceBySessionAndStudent(
            @PathVariable UUID sessionId, @PathVariable UUID studentId) {
        authz.assertCanViewClassSession(sessionId);
        authz.assertCanViewStudent(studentId);
        return sessionAttendanceRepository
                .findBySessionIdAndStudentId(sessionId, studentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<List<SessionAttendance>> getAttendanceByStatus(@PathVariable String status) {
        return ResponseEntity.ok(sessionAttendanceRepository.findByStatus(status));
    }

    @GetMapping("/student/{studentId}/status/{status}/count")
    public ResponseEntity<Long> countAttendanceByStatus(
            @PathVariable UUID studentId, @PathVariable String status) {
        authz.assertCanViewStudent(studentId);
        return ResponseEntity.ok(sessionAttendanceRepository.countByStudentIdAndStatus(studentId, status));
    }

    @PostMapping
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<SessionAttendance> createAttendance(@Valid @RequestBody SessionAttendance attendance) {
        return ResponseEntity.ok(sessionAttendanceRepository.save(attendance));
    }

    @PostMapping("/bulk")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<List<SessionAttendance>> createBulkAttendance(
            @Valid @RequestBody List<SessionAttendance> attendanceList) {
        return ResponseEntity.ok(sessionAttendanceService.upsertBulk(attendanceList));
    }

    @PutMapping("/{id}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<SessionAttendance> updateAttendance(
            @PathVariable UUID id, @Valid @RequestBody SessionAttendance attendanceDetails) {
        return sessionAttendanceRepository
                .findById(id)
                .map(attendance -> {
                    if (attendanceDetails.getStatus() != null) {
                        attendance.setStatus(attendanceDetails.getStatus());
                    }
                    if (attendanceDetails.getCheckInTime() != null) {
                        attendance.setCheckInTime(attendanceDetails.getCheckInTime());
                    }
                    if (attendanceDetails.getCheckOutTime() != null) {
                        attendance.setCheckOutTime(attendanceDetails.getCheckOutTime());
                    }
                    if (attendanceDetails.getNotes() != null) {
                        attendance.setNotes(attendanceDetails.getNotes());
                    }
                    return ResponseEntity.ok(sessionAttendanceRepository.save(attendance));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status/{status}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<SessionAttendance> updateAttendanceStatus(
            @PathVariable UUID id, @PathVariable String status) {
        return sessionAttendanceRepository
                .findById(id)
                .map(attendance -> {
                    attendance.setStatus(status);
                    return ResponseEntity.ok(sessionAttendanceRepository.save(attendance));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<Void> deleteAttendance(@PathVariable UUID id) {
        if (sessionAttendanceRepository.existsById(id)) {
            sessionAttendanceRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
