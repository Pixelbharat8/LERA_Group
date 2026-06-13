package com.lera.payroll_service.controller;

import com.lera.payroll_service.entity.PayrollCycle;
import com.lera.payroll_service.service.JdbcAuditWriter;
import com.lera.payroll_service.service.PayrollCycleService;
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
@RequestMapping("/api/payroll-cycles")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
public class PayrollCycleController {

    private final PayrollCycleService payrollCycleService;
    private final JdbcAuditWriter auditWriter;

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    @GetMapping
    public ResponseEntity<List<PayrollCycle>> getAllCycles() {
        return ResponseEntity.ok(payrollCycleService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PayrollCycle> getCycleById(@PathVariable UUID id) {
        return payrollCycleService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<PayrollCycle>> getCyclesByStatus(@PathVariable String status) {
        return ResponseEntity.ok(payrollCycleService.getByStatus(status));
    }

    @GetMapping("/name/{name}")
    public ResponseEntity<PayrollCycle> getCycleByName(@PathVariable String name) {
        return payrollCycleService.getByName(name)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<PayrollCycle>> getCyclesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(payrollCycleService.getByDateRange(startDate, endDate));
    }

    @GetMapping("/current")
    public ResponseEntity<List<PayrollCycle>> getCurrentCycles() {
        return ResponseEntity.ok(payrollCycleService.getCurrent());
    }

    @PostMapping
    public ResponseEntity<PayrollCycle> createCycle(@Valid @RequestBody PayrollCycle cycle) {
        PayrollCycle saved = payrollCycleService.create(cycle);
        auditWriter.log("PAYROLL_CYCLE_CREATED", "PayrollCycle", saved.getId(), null, null,
                "{\"cycleName\":\"" + esc(saved.getCycleName()) + "\"}");
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PayrollCycle> updateCycle(@PathVariable UUID id, @Valid @RequestBody PayrollCycle cycleDetails) {
        Optional<PayrollCycle> oldOpt = payrollCycleService.getById(id);
        return payrollCycleService.update(id, cycleDetails)
                .map(updated -> {
                    oldOpt.ifPresent(old -> auditWriter.log("PAYROLL_CYCLE_UPDATED", "PayrollCycle", id, null,
                            "{\"status\":\"" + esc(old.getStatus()) + "\"}",
                            "{\"status\":\"" + esc(updated.getStatus()) + "\"}"));
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status/{status}")
    public ResponseEntity<PayrollCycle> updateCycleStatus(@PathVariable UUID id, @PathVariable String status) {
        Optional<PayrollCycle> oldOpt = payrollCycleService.getById(id);
        String oldStatus = oldOpt.map(PayrollCycle::getStatus).orElse(null);
        return payrollCycleService.updateStatus(id, status)
                .map(cycle -> {
                    auditWriter.log("PAYROLL_CYCLE_STATUS_CHANGED", "PayrollCycle", id, null,
                            "{\"status\":\"" + esc(oldStatus) + "\"}",
                            "{\"status\":\"" + esc(status) + "\"}");
                    return ResponseEntity.ok(cycle);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCycle(@PathVariable UUID id) {
        Optional<PayrollCycle> oldOpt = payrollCycleService.getById(id);
        boolean deleted = payrollCycleService.delete(id);
        if (deleted) {
            oldOpt.ifPresent(c -> auditWriter.log("PAYROLL_CYCLE_DELETED", "PayrollCycle", id, null,
                    "{\"cycleName\":\"" + esc(c.getCycleName()) + "\"}", null));
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
