package com.lera.payroll_service.controller;

import com.lera.payroll_service.entity.PayrollRecord;
import com.lera.payroll_service.security.AuthUser;
import com.lera.payroll_service.security.PayrollAuthorizationService;
import com.lera.payroll_service.service.PayrollRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/payroll-records")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class PayrollRecordController {

    private final PayrollRecordService payrollRecordService;
    private final PayrollAuthorizationService authz;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACCOUNTANT','ACADEMIC_MANAGER','TEACHER','STAFF')")
    public ResponseEntity<List<PayrollRecord>> getAll(
            @RequestParam(required = false) UUID centerId,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) UUID teacherId,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID subject = userId != null ? userId : teacherId;
        if (subject != null) {
            UUID eff = authz.effectivePayrollSubjectId(authUser, subject);
            List<PayrollRecord> rows = payrollRecordService.getByTeacher(eff);
            authz.assertPayrollRecordsForCaller(authUser, rows);
            return ResponseEntity.ok(rows);
        }
        if (status != null) {
            authz.assertPayrollManagement(authUser);
            List<PayrollRecord> rows = payrollRecordService.getByStatus(status);
            UUID effCenter = authz.effectiveQueryCenterId(authUser, centerId);
            if (effCenter != null) {
                rows = rows.stream().filter(r -> effCenter.equals(r.getCenterId())).toList();
            } else if (!authz.isOrgWide(authUser)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "centerId is required unless you have an org-wide role");
            }
            authz.assertPayrollRecordsForCaller(authUser, rows);
            return ResponseEntity.ok(rows);
        }
        UUID effCenter = authz.effectiveQueryCenterId(authUser, centerId);
        if (effCenter != null) {
            List<PayrollRecord> rows = payrollRecordService.getByCenter(effCenter);
            authz.assertPayrollRecordsForCaller(authUser, rows);
            return ResponseEntity.ok(rows);
        }
        if (authz.isOrgWide(authUser)) {
            return ResponseEntity.ok(payrollRecordService.getAll());
        }
        UUID self = authz.requireUserId(authUser);
        List<PayrollRecord> rows = payrollRecordService.getByTeacher(self);
        authz.assertPayrollRecordsForCaller(authUser, rows);
        return ResponseEntity.ok(rows);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PayrollRecord> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return payrollRecordService.getById(id)
                .map(r -> {
                    authz.assertCanViewPayrollRecord(authUser, r);
                    return ResponseEntity.ok(r);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/center/{centerId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACCOUNTANT','ACADEMIC_MANAGER')")
    public ResponseEntity<List<PayrollRecord>> getByCenter(
            @PathVariable UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID eff = authz.effectiveQueryCenterId(authUser, centerId);
        List<PayrollRecord> rows = payrollRecordService.getByCenter(eff);
        authz.assertPayrollRecordsForCaller(authUser, rows);
        return ResponseEntity.ok(rows);
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<PayrollRecord>> getByTeacher(
            @PathVariable UUID teacherId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID subject = authz.effectivePayrollSubjectId(authUser, teacherId);
        List<PayrollRecord> rows = payrollRecordService.getByTeacher(subject);
        authz.assertPayrollRecordsForCaller(authUser, rows);
        return ResponseEntity.ok(rows);
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACCOUNTANT','ACADEMIC_MANAGER')")
    public ResponseEntity<List<PayrollRecord>> getByStatus(
            @PathVariable String status,
            @RequestParam(required = false) UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        List<PayrollRecord> rows = payrollRecordService.getByStatus(status);
        UUID effCenter = authz.effectiveQueryCenterId(authUser, centerId);
        if (effCenter != null) {
            rows = rows.stream().filter(r -> effCenter.equals(r.getCenterId())).toList();
        } else if (!authz.isOrgWide(authUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "centerId is required unless you have an org-wide role");
        }
        authz.assertPayrollRecordsForCaller(authUser, rows);
        return ResponseEntity.ok(rows);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<PayrollRecord> create(
            @Valid @RequestBody PayrollRecord record,
            @AuthenticationPrincipal AuthUser authUser) {
        authz.assertPayrollManagement(authUser);
        return ResponseEntity.ok(payrollRecordService.create(record));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<PayrollRecord> update(
            @PathVariable UUID id,
            @Valid @RequestBody PayrollRecord details,
            @AuthenticationPrincipal AuthUser authUser) {
        return payrollRecordService.getById(id)
                .flatMap(existing -> {
                    authz.assertCanViewPayrollRecord(authUser, existing);
                    authz.assertPayrollManagement(authUser);
                    return payrollRecordService.update(id, details);
                })
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        Optional<PayrollRecord> existing = payrollRecordService.getById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        authz.assertCanViewPayrollRecord(authUser, existing.get());
        if (payrollRecordService.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
