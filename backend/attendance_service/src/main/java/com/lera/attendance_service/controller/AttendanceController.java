package com.lera.attendance_service.controller;

import com.lera.attendance_service.entity.AttendanceRecord;
import com.lera.attendance_service.security.AttendanceAuthorizationService;
import com.lera.attendance_service.security.AuthUser;
import com.lera.attendance_service.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {
    
    private final AttendanceService attendanceService;
    private final AttendanceAuthorizationService authz;
    
    @GetMapping
    public ResponseEntity<?> getAllAttendance(
            @RequestParam(required = false) String date,
            @RequestParam(required = false) UUID centerId,
            @RequestParam(required = false) UUID studentId,
            @RequestParam(required = false) UUID classId,
            @RequestParam(required = false) UUID markedBy,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            Pageable pageable,
            @AuthenticationPrincipal AuthUser authUser) {
        authz.assertAuthenticated(authUser);
        if (markedBy != null) {
            UUID effectiveMarker = authz.effectiveMarkedById(authUser, markedBy);
            List<AttendanceRecord> list = attendanceService.getAttendanceByMarkedBy(effectiveMarker);
            authz.assertAttendanceRecordsForCaller(authUser, list);
            return ResponseEntity.ok(list);
        }
        if (studentId != null) {
            List<AttendanceRecord> list = attendanceService.getAttendanceByStudent(studentId);
            authz.assertAttendanceRecordsForCaller(authUser, list);
            return ResponseEntity.ok(list);
        }
        if (classId != null) {
            List<AttendanceRecord> list = attendanceService.getAttendanceByClass(classId);
            authz.assertAttendanceRecordsForCaller(authUser, list);
            return ResponseEntity.ok(list);
        }
        UUID effCenter = authz.effectiveQueryCenterId(authUser, centerId);
        if (effCenter != null) {
            return ResponseEntity.ok(attendanceService.getAttendanceByCenter(effCenter));
        }
        if (authz.isOrgWide(authUser)) {
            return ResponseEntity.ok(attendanceService.getAllAttendance(pageable));
        }
        if (authz.mayDefaultToJwtCenterAttendanceList(authUser) && authUser.getCenterId() != null) {
            return ResponseEntity.ok(attendanceService.getAttendanceByCenter(authUser.getCenterId()));
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Specify centerId or studentId for attendance list queries");
    }

    /**
     * Aggregated attendance for analytics and superadmin reports. Must be registered before {@code /{id}}.
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER')")
    public ResponseEntity<Map<String, Object>> attendanceSummary(
            @RequestParam(required = false) UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        authz.assertAuthenticated(authUser);
        UUID eff = authz.effectiveQueryCenterId(authUser, centerId);
        if (eff == null && !authz.isOrgWide(authUser)
                && authz.mayDefaultToJwtCenterAttendanceList(authUser)
                && authUser.getCenterId() != null) {
            eff = authUser.getCenterId();
        }
        if (eff == null && !authz.isOrgWide(authUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "centerId is required for attendance summary unless you have an org-wide role");
        }
        return ResponseEntity.ok(attendanceService.getAttendanceSummary(eff));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<AttendanceRecord> getAttendanceById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return attendanceService.getAttendanceById(id)
                .map(record -> {
                    authz.assertAttendanceRecord(authUser, record);
                    return ResponseEntity.ok(record);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<AttendanceRecord>> getAttendanceByStudent(
            @PathVariable UUID studentId,
            @AuthenticationPrincipal AuthUser authUser) {
        List<AttendanceRecord> list = attendanceService.getAttendanceByStudent(studentId);
        authz.assertAttendanceRecordsForCaller(authUser, list);
        return ResponseEntity.ok(list);
    }
    
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<AttendanceRecord>> getAttendanceBySession(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal AuthUser authUser) {
        List<AttendanceRecord> list = attendanceService.getAttendanceBySession(sessionId);
        authz.assertAttendanceRecordsForCaller(authUser, list);
        return ResponseEntity.ok(list);
    }
    
    @GetMapping("/student/{studentId}/stats")
    public ResponseEntity<Map<String, Object>> getStudentStats(
            @PathVariable UUID studentId,
            @AuthenticationPrincipal AuthUser authUser) {
        List<AttendanceRecord> list = attendanceService.getAttendanceByStudent(studentId);
        authz.assertAttendanceRecordsForCaller(authUser, list);
        return ResponseEntity.ok(attendanceService.getStudentStats(studentId));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','TEACHER')")
    public ResponseEntity<?> createAttendance(@Valid @RequestBody AttendanceRecord record) {
        return ResponseEntity.ok(attendanceService.createAttendance(record));
    }
    
    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','TEACHER')")
    public ResponseEntity<List<AttendanceRecord>> createBulkAttendance(@Valid @RequestBody List<AttendanceRecord> records) {
        return ResponseEntity.ok(attendanceService.createBulkAttendance(records));
    }

    @PostMapping("/mark")
    public ResponseEntity<?> markSelfAttendance(
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        authz.assertAuthenticated(authUser);
        UUID self = authz.requireUserId(authUser);
        return ResponseEntity.ok(attendanceService.markSelfAttendance(request, self, authUser.getCenterId()));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','TEACHER')")
    public ResponseEntity<AttendanceRecord> updateAttendance(
            @PathVariable UUID id,
            @Valid @RequestBody AttendanceRecord recordDetails,
            @AuthenticationPrincipal AuthUser authUser) {
        return attendanceService.getAttendanceById(id)
                .flatMap(existing -> {
                    authz.assertAttendanceRecord(authUser, existing);
                    return attendanceService.updateAttendance(id, recordDetails);
                })
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
    public ResponseEntity<Void> deleteAttendance(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        Optional<AttendanceRecord> existing = attendanceService.getAttendanceById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        authz.assertAttendanceRecord(authUser, existing.get());
        if (attendanceService.deleteAttendance(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/user/{userId}/summary")
    public ResponseEntity<Map<String, Object>> getUserAttendanceSummary(
            @PathVariable UUID userId,
            @RequestParam(required = false, defaultValue = "2025") int year,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID effectiveUser = authz.effectiveMarkedById(authUser, userId);
        List<AttendanceRecord> list = attendanceService.getAttendanceByMarkedBy(effectiveUser);
        if (list.isEmpty()) {
            list = attendanceService.getAttendanceByStudent(effectiveUser);
        }
        authz.assertAttendanceRecordsForCaller(authUser, list);
        return ResponseEntity.ok(attendanceService.getUserAttendanceSummary(effectiveUser, year));
    }
}
