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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final AttendanceAuthorizationService authz;
    private final com.lera.attendance_service.client.StudentAccessClient studentAccessClient;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    /**
     * Attendance rows carry only a studentId; enrich each with the student's display name from the
     * shared students table (one batched query) so list responses aren't bare UUIDs. Without this
     * the center-admin attendance page crashed on record.studentName.toLowerCase().
     */
    private List<AttendanceRecord> withNames(List<AttendanceRecord> records) {
        if (records == null || records.isEmpty()) return records;
        List<UUID> ids = records.stream().map(AttendanceRecord::getStudentId)
                .filter(Objects::nonNull).distinct().collect(Collectors.toList());
        if (ids.isEmpty()) return records;
        Map<UUID, String> names = new HashMap<>();
        String placeholders = ids.stream().map(x -> "?").collect(Collectors.joining(","));
        jdbcTemplate.query("SELECT id, fullname FROM students WHERE id IN (" + placeholders + ")",
                (java.sql.ResultSet rs) -> { names.put(rs.getObject("id", UUID.class), rs.getString("fullname")); },
                ids.toArray());
        records.forEach(r -> r.setStudentName(names.get(r.getStudentId())));
        return records;
    }

    /**
     * SECURITY: a STUDENT/PARENT may only query a student they own/are linked to. Attendance
     * doesn't hold the parent↔student link, so academy verifies it. Staff are scoped by centre
     * via {@link AttendanceAuthorizationService} instead.
     */
    private void assertStudentOwnership(AuthUser authUser, UUID studentId) {
        String role = (authUser != null && authUser.getRoleName() != null)
                ? authUser.getRoleName().toUpperCase() : "";
        if (("STUDENT".equals(role) || "PARENT".equals(role))
                && !studentAccessClient.canUserViewStudent(studentId, authUser.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only view your own student's attendance");
        }
    }
    
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
            return ResponseEntity.ok(withNames(list));
        }
        if (studentId != null) {
            assertStudentOwnership(authUser, studentId);
            List<AttendanceRecord> list = attendanceService.getAttendanceByStudent(studentId);
            authz.assertAttendanceRecordsForCaller(authUser, list);
            return ResponseEntity.ok(withNames(list));
        }
        if (classId != null) {
            List<AttendanceRecord> list = attendanceService.getAttendanceByClass(classId);
            authz.assertAttendanceRecordsForCaller(authUser, list);
            return ResponseEntity.ok(withNames(list));
        }
        UUID effCenter = authz.effectiveQueryCenterId(authUser, centerId);
        if (effCenter != null) {
            return ResponseEntity.ok(withNames(attendanceService.getAttendanceByCenter(effCenter)));
        }
        if (authz.isOrgWide(authUser)) {
            return ResponseEntity.ok(attendanceService.getAllAttendance(pageable));
        }
        if (authz.mayDefaultToJwtCenterAttendanceList(authUser) && authUser.getCenterId() != null) {
            return ResponseEntity.ok(withNames(attendanceService.getAttendanceByCenter(authUser.getCenterId())));
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
                    // A STUDENT/PARENT may only read a record for a student they own — the authz
                    // helper alone allows null-centre student/parent through, so check ownership.
                    assertStudentOwnership(authUser, record.getStudentId());
                    authz.assertAttendanceRecord(authUser, record);
                    return ResponseEntity.ok(record);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<AttendanceRecord>> getAttendanceByStudent(
            @PathVariable UUID studentId,
            @AuthenticationPrincipal AuthUser authUser) {
        assertStudentOwnership(authUser, studentId);
        List<AttendanceRecord> list = attendanceService.getAttendanceByStudent(studentId);
        authz.assertAttendanceRecordsForCaller(authUser, list);
        return ResponseEntity.ok(list);
    }
    
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<AttendanceRecord>> getAttendanceBySession(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal AuthUser authUser) {
        List<AttendanceRecord> list = attendanceService.getAttendanceBySession(sessionId);
        // A session roster is every student's attendance — a STUDENT/PARENT must not read the
        // whole roster; restrict them to only rows for students they own.
        String role = (authUser != null && authUser.getRoleName() != null) ? authUser.getRoleName().toUpperCase() : "";
        if ("STUDENT".equals(role) || "PARENT".equals(role)) {
            list = list.stream()
                    .filter(r -> r.getStudentId() != null
                            && studentAccessClient.canUserViewStudent(r.getStudentId(), authUser.getUserId()))
                    .collect(java.util.stream.Collectors.toList());
        } else {
            authz.assertAttendanceRecordsForCaller(authUser, list);
        }
        return ResponseEntity.ok(list);
    }
    
    @GetMapping("/student/{studentId}/stats")
    public ResponseEntity<Map<String, Object>> getStudentStats(
            @PathVariable UUID studentId,
            @AuthenticationPrincipal AuthUser authUser) {
        assertStudentOwnership(authUser, studentId);
        List<AttendanceRecord> list = attendanceService.getAttendanceByStudent(studentId);
        authz.assertAttendanceRecordsForCaller(authUser, list);
        return ResponseEntity.ok(attendanceService.getStudentStats(studentId));
    }
    
    /**
     * Prevent centre-scoped staff from fabricating attendance for another centre. Org-wide roles
     * may write any centre; everyone else has the record's centre DERIVED from their JWT (and a
     * mismatched body centreId is rejected outright).
     */
    private UUID resolveWriteCenter(AuthUser authUser, UUID recordCenterId) {
        if (authz.isOrgWide(authUser)) {
            return recordCenterId;
        }
        UUID jwt = authUser != null ? authUser.getCenterId() : null;
        if (jwt == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your token has no centre");
        }
        if (recordCenterId != null && !recordCenterId.equals(jwt)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only mark attendance for your own centre");
        }
        return jwt;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','TEACHER')")
    public ResponseEntity<?> createAttendance(@Valid @RequestBody AttendanceRecord record,
            @AuthenticationPrincipal AuthUser authUser) {
        record.setCenterId(resolveWriteCenter(authUser, record.getCenterId()));
        return ResponseEntity.ok(attendanceService.createAttendance(record));
    }
    
    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','TEACHER')")
    public ResponseEntity<List<AttendanceRecord>> createBulkAttendance(@Valid @RequestBody List<AttendanceRecord> records,
            @AuthenticationPrincipal AuthUser authUser) {
        for (AttendanceRecord r : records) {
            r.setCenterId(resolveWriteCenter(authUser, r.getCenterId()));
        }
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
