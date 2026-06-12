package com.lera.attendance_service.controller;

import com.lera.attendance_service.entity.AttendanceException;
import com.lera.attendance_service.security.AttendanceAuthorizationService;
import com.lera.attendance_service.security.AuthUser;
import com.lera.attendance_service.service.AttendanceExceptionService;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/attendance-exceptions")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class AttendanceExceptionController {

    private final AttendanceExceptionService attendanceExceptionService;
    private final AttendanceAuthorizationService authz;

    @GetMapping
    @PreAuthorize(AttendanceAuthorizationService.PRE_CENTER_ATTENDANCE_EXCEPTION_READS)
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) UUID centerId,
            Pageable pageable,
            @AuthenticationPrincipal AuthUser authUser) {
        authz.assertAuthenticated(authUser);
        UUID effCenter = authz.effectiveQueryCenterId(authUser, centerId);
        if (effCenter != null) {
            return ResponseEntity.ok(attendanceExceptionService.getByCenter(effCenter));
        }
        if (authz.isOrgWide(authUser)) {
            return ResponseEntity.ok(attendanceExceptionService.getAll(pageable));
        }
        if (authz.mayDefaultToJwtCenterAttendanceList(authUser) && authUser.getCenterId() != null) {
            return ResponseEntity.ok(attendanceExceptionService.getByCenter(authUser.getCenterId()));
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Specify centerId for attendance exception list queries");
    }

    @GetMapping("/{id}")
    public ResponseEntity<AttendanceException> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return attendanceExceptionService.getById(id)
                .map(row -> {
                    authz.assertAttendanceException(authUser, row);
                    return ResponseEntity.ok(row);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<AttendanceException>> getByStudent(
            @PathVariable UUID studentId,
            @AuthenticationPrincipal AuthUser authUser) {
        List<AttendanceException> list = attendanceExceptionService.getByStudent(studentId);
        authz.assertAttendanceExceptionsForCaller(authUser, list);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/status/{status}")
    @PreAuthorize(AttendanceAuthorizationService.PRE_CENTER_ATTENDANCE_EXCEPTION_READS)
    public ResponseEntity<List<AttendanceException>> getByStatus(
            @PathVariable String status,
            @RequestParam(required = false) UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        authz.assertAuthenticated(authUser);
        List<AttendanceException> list = attendanceExceptionService.getByStatus(status);
        UUID effCenter = authz.effectiveQueryCenterId(authUser, centerId);
        if (effCenter != null) {
            list = list.stream().filter(e -> effCenter.equals(e.getCenterId())).toList();
        } else if (!authz.isOrgWide(authUser) && authUser.getCenterId() != null) {
            UUID jwt = authUser.getCenterId();
            list = list.stream().filter(e -> jwt.equals(e.getCenterId())).toList();
        }
        authz.assertAttendanceExceptionsForCaller(authUser, list);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/class/{classId}")
    @PreAuthorize(AttendanceAuthorizationService.PRE_CENTER_ATTENDANCE_EXCEPTION_READS)
    public ResponseEntity<List<AttendanceException>> getByClass(
            @PathVariable UUID classId,
            @AuthenticationPrincipal AuthUser authUser) {
        List<AttendanceException> list = attendanceExceptionService.getByClass(classId);
        authz.assertAttendanceExceptionsForCaller(authUser, list);
        return ResponseEntity.ok(list);
    }

    @PostMapping
    @PreAuthorize(AttendanceAuthorizationService.PRE_CENTER_ATTENDANCE_EXCEPTION_READS)
    public ResponseEntity<AttendanceException> create(
            @Valid @RequestBody AttendanceException exception,
            @AuthenticationPrincipal AuthUser authUser) {
        authz.assertCanMutateAttendanceException(authUser, exception);
        return ResponseEntity.ok(attendanceExceptionService.create(exception));
    }

    @PutMapping("/{id}")
    @PreAuthorize(AttendanceAuthorizationService.PRE_CENTER_ATTENDANCE_EXCEPTION_READS)
    public ResponseEntity<AttendanceException> update(
            @PathVariable UUID id,
            @Valid @RequestBody AttendanceException details,
            @AuthenticationPrincipal AuthUser authUser) {
        AttendanceException existing = attendanceExceptionService.getById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        authz.assertCanMutateAttendanceException(authUser, existing);
        if (details.getCenterId() == null) {
            details.setCenterId(existing.getCenterId());
        }
        authz.assertCanMutateAttendanceException(authUser, details);
        return attendanceExceptionService.update(id, details)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(AttendanceAuthorizationService.PRE_CENTER_ATTENDANCE_EXCEPTION_READS)
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        AttendanceException existing = attendanceExceptionService.getById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        authz.assertCanMutateAttendanceException(authUser, existing);
        return attendanceExceptionService.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
