package com.lera.payroll_service.controller;

import com.lera.payroll_service.entity.SalaryPayout;
import com.lera.payroll_service.service.JdbcAuditWriter;
import com.lera.payroll_service.service.SalaryPayoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/salary-payouts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','ACCOUNTANT')")
public class SalaryPayoutController {

    private final SalaryPayoutService salaryPayoutService;
    private final JdbcAuditWriter auditWriter;

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    @GetMapping
    public ResponseEntity<List<SalaryPayout>> getAllPayouts() {
        return ResponseEntity.ok(salaryPayoutService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalaryPayout> getPayoutById(@PathVariable UUID id) {
        return salaryPayoutService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<SalaryPayout>> getPayoutsByTeacher(@PathVariable UUID teacherId) {
        return ResponseEntity.ok(salaryPayoutService.getByTeacher(teacherId));
    }

    @GetMapping("/salary/{salaryId}")
    public ResponseEntity<List<SalaryPayout>> getPayoutsBySalary(@PathVariable UUID salaryId) {
        return ResponseEntity.ok(salaryPayoutService.getBySalary(salaryId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<SalaryPayout>> getPayoutsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(salaryPayoutService.getByStatus(status));
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<SalaryPayout>> getPayoutsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(salaryPayoutService.getByDateRange(startDate, endDate));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','ACCOUNTANT')")
    public ResponseEntity<SalaryPayout> createPayout(@Valid @RequestBody SalaryPayout payout) {
        SalaryPayout saved = salaryPayoutService.create(payout);
        auditWriter.log("SALARY_PAYOUT_CREATED", "SalaryPayout", saved.getId(), null, null,
                "{\"teacherId\":\"" + saved.getTeacherId() + "\",\"amount\":\"" + saved.getAmount() + "\"}");
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','ACCOUNTANT')")
    public ResponseEntity<SalaryPayout> updatePayout(@PathVariable UUID id, @Valid @RequestBody SalaryPayout payoutDetails) {
        Optional<SalaryPayout> oldOpt = salaryPayoutService.getById(id);
        return salaryPayoutService.update(id, payoutDetails)
                .map(updated -> {
                    oldOpt.ifPresent(old -> auditWriter.log("SALARY_PAYOUT_UPDATED", "SalaryPayout", id, null,
                            "{\"status\":\"" + esc(old.getStatus()) + "\"}",
                            "{\"status\":\"" + esc(updated.getStatus()) + "\"}"));
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status/{status}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<SalaryPayout> updatePayoutStatus(@PathVariable UUID id, @PathVariable String status) {
        Optional<SalaryPayout> oldOpt = salaryPayoutService.getById(id);
        String oldStatus = oldOpt.map(SalaryPayout::getStatus).orElse(null);
        return salaryPayoutService.updateStatus(id, status)
                .map(payout -> {
                    auditWriter.log("SALARY_PAYOUT_STATUS_CHANGED", "SalaryPayout", id, null,
                            "{\"status\":\"" + esc(oldStatus) + "\"}",
                            "{\"status\":\"" + esc(status) + "\"}");
                    return ResponseEntity.ok(payout);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Void> deletePayout(@PathVariable UUID id) {
        Optional<SalaryPayout> oldOpt = salaryPayoutService.getById(id);
        boolean deleted = salaryPayoutService.delete(id);
        if (deleted) {
            oldOpt.ifPresent(p -> auditWriter.log("SALARY_PAYOUT_DELETED", "SalaryPayout", id, null,
                    "{\"teacherId\":\"" + p.getTeacherId() + "\"}", null));
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
