package com.lera.payroll_service.controller;

import com.lera.payroll_service.entity.PayrollRecord;
import com.lera.payroll_service.security.AuthUser;
import com.lera.payroll_service.security.PayrollAuthorizationService;
import com.lera.payroll_service.service.PayrollService;
import com.lera.payroll_service.dto.GeneratePayrollRequest;
import com.lera.payroll_service.service.PayrollGenerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class PayrollController {

    private final PayrollService payrollService;
    private final PayrollGenerationService payrollGenerationService;
    private final PayrollAuthorizationService authz;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACCOUNTANT','ACADEMIC_MANAGER')")
    public ResponseEntity<List<PayrollRecord>> getAllPayroll(
            @RequestParam(required = false) UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID effCenter = authz.effectiveQueryCenterId(authUser, centerId);
        List<PayrollRecord> rows;
        if (effCenter != null) {
            rows = payrollService.getByCenter(effCenter);
        } else if (authz.isOrgWide(authUser)) {
            rows = payrollService.getAll();
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "centerId is required for payroll list queries unless you have an org-wide role");
        }
        authz.assertPayrollRecordsForCaller(authUser, rows);
        return ResponseEntity.ok(rows);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PayrollRecord> getPayrollById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return payrollService.getById(id)
                .map(r -> {
                    authz.assertCanViewPayrollRecord(authUser, r);
                    return ResponseEntity.ok(r);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<PayrollRecord>> getPayrollByTeacher(
            @PathVariable UUID teacherId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID subject = authz.effectivePayrollSubjectId(authUser, teacherId);
        List<PayrollRecord> rows = payrollService.getByTeacher(subject);
        authz.assertPayrollRecordsForCaller(authUser, rows);
        return ResponseEntity.ok(rows);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PayrollRecord>> getPayrollByUser(
            @PathVariable UUID userId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID subject = authz.effectivePayrollSubjectId(authUser, userId);
        List<PayrollRecord> rows = payrollService.getByTeacher(subject);
        authz.assertPayrollRecordsForCaller(authUser, rows);
        return ResponseEntity.ok(rows);
    }

    @GetMapping("/user/{userId}/year/{year}")
    public ResponseEntity<List<PayrollRecord>> getPayrollByUserAndYear(
            @PathVariable UUID userId,
            @PathVariable Integer year,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID subject = authz.effectivePayrollSubjectId(authUser, userId);
        List<PayrollRecord> rows = payrollService.getByTeacherAndYear(subject, year);
        authz.assertPayrollRecordsForCaller(authUser, rows);
        return ResponseEntity.ok(rows);
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACCOUNTANT','ACADEMIC_MANAGER')")
    public ResponseEntity<List<PayrollRecord>> getPayrollByStatus(
            @PathVariable String status,
            @RequestParam(required = false) UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        List<PayrollRecord> rows = payrollService.getByStatus(status);
        UUID effCenter = authz.effectiveQueryCenterId(authUser, centerId);
        if (effCenter != null) {
            rows = rows.stream().filter(r -> effCenter.equals(r.getCenterId())).toList();
        } else if (!authz.isOrgWide(authUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "centerId is required for payroll status queries unless you have an org-wide role");
        }
        authz.assertPayrollRecordsForCaller(authUser, rows);
        return ResponseEntity.ok(rows);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACCOUNTANT','ACADEMIC_MANAGER')")
    public ResponseEntity<Map<String, Object>> getPayrollStats(
            @RequestParam(required = false) UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        authz.assertPayrollManagement(authUser);
        return ResponseEntity.ok(payrollService.getStats());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<PayrollRecord> createPayrollRecord(
            @Valid @RequestBody PayrollRecord record,
            @AuthenticationPrincipal AuthUser authUser) {
        authz.assertPayrollManagement(authUser);
        return ResponseEntity.ok(payrollService.create(record));
    }

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<List<PayrollRecord>> generatePayroll(
            @Valid @RequestBody GeneratePayrollRequest request,
            @AuthenticationPrincipal AuthUser authUser) {
        authz.assertPayrollManagement(authUser);
        return ResponseEntity.ok(payrollGenerationService.generatePayrollForPeriod(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<PayrollRecord> updatePayrollRecord(
            @PathVariable UUID id,
            @Valid @RequestBody PayrollRecord recordDetails,
            @AuthenticationPrincipal AuthUser authUser) {
        return payrollService.getById(id)
                .flatMap(existing -> {
                    authz.assertCanViewPayrollRecord(authUser, existing);
                    authz.assertPayrollManagement(authUser);
                    return payrollService.update(id, recordDetails);
                })
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<PayrollRecord> approvePayroll(
            @PathVariable UUID id,
            @Valid @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal AuthUser authUser) {
        return payrollService.getById(id)
                .flatMap(existing -> {
                    authz.assertCanViewPayrollRecord(authUser, existing);
                    UUID approvedBy = body.get("approvedBy") != null
                            ? UUID.fromString(body.get("approvedBy").toString())
                            : authz.requireUserId(authUser);
                    return payrollService.approve(id, approvedBy);
                })
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/pay")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<PayrollRecord> markAsPaid(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return payrollService.getById(id)
                .flatMap(existing -> {
                    authz.assertCanViewPayrollRecord(authUser, existing);
                    return payrollService.updateStatus(id, "PAID");
                })
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
