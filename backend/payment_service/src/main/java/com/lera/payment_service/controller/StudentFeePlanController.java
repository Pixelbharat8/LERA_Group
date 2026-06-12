package com.lera.payment_service.controller;

import com.lera.payment_service.entity.StudentFeePlan;
import com.lera.payment_service.security.AuthUser;
import com.lera.payment_service.security.PaymentAccessService;
import com.lera.payment_service.service.JdbcAuditWriter;
import com.lera.payment_service.service.StudentFeePlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/student-fee-plans")
@RequiredArgsConstructor
public class StudentFeePlanController {

    private final StudentFeePlanService studentFeePlanService;
    private final JdbcAuditWriter auditWriter;
    private final PaymentAccessService paymentAccess;

    @GetMapping
    public ResponseEntity<?> getAll(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam(required = false) UUID studentId,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (studentId != null) {
            paymentAccess.assertCanViewStudentEntity(authUser, studentId);
            if (status != null) {
                return ResponseEntity.ok(studentFeePlanService.getPlansByStudentAndStatus(studentId, status));
            }
            return ResponseEntity.ok(studentFeePlanService.getPlansByStudent(studentId));
        }

        if (status != null) {
            paymentAccess.assertPrivilegedStaff(authUser);
            return ResponseEntity.ok(studentFeePlanService.getPlansByStatus(status));
        }

        paymentAccess.assertPrivilegedStaff(authUser);
        return ResponseEntity.ok(studentFeePlanService.getAllPlans(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentFeePlan> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return studentFeePlanService.getPlanById(id)
                .filter(plan -> paymentAccess.canViewStudentEntity(authUser, plan.getStudentId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<StudentFeePlan> create(@Valid @RequestBody StudentFeePlan plan) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studentFeePlanService.createPlan(plan));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<StudentFeePlan> update(@PathVariable UUID id, @Valid @RequestBody StudentFeePlan plan) {
        return studentFeePlanService.updatePlan(id, plan)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        return studentFeePlanService.deletePlan(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<Map<String, Object>> activate(@PathVariable UUID id) {
        Map<String, Object> response = new HashMap<>();
        return studentFeePlanService.setStatus(id, "ACTIVE")
                .map(plan -> {
                    auditWriter.log("FEE_PLAN_ACTIVATED", "StudentFeePlan", id, null, null,
                            "{\"status\":\"ACTIVE\"}");
                    response.put("success", true);
                    response.put("message", "Plan activated");
                    response.put("data", plan);
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    response.put("success", false);
                    response.put("message", "Plan not found");
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                });
    }

    @PostMapping("/{id}/suspend")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<Map<String, Object>> suspend(@PathVariable UUID id) {
        Map<String, Object> response = new HashMap<>();
        return studentFeePlanService.setStatus(id, "SUSPENDED")
                .map(plan -> {
                    auditWriter.log("FEE_PLAN_SUSPENDED", "StudentFeePlan", id, null, null,
                            "{\"status\":\"SUSPENDED\"}");
                    response.put("success", true);
                    response.put("message", "Plan suspended");
                    response.put("data", plan);
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    response.put("success", false);
                    response.put("message", "Plan not found");
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                });
    }

    @PostMapping("/{id}/generate-invoice")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<Map<String, Object>> generateInvoice(@PathVariable UUID id) {
        Map<String, Object> response = new HashMap<>();
        return studentFeePlanService.generateInvoiceForPlan(id)
                .map(invoice -> {
                    auditWriter.log("FEE_PLAN_INVOICE_GENERATED", "StudentFeePlan", id, null, null,
                            "{\"action\":\"GENERATE_INVOICE\"}");
                    response.put("success", true);
                    response.put("message", "Invoice generated");
                    response.put("data", invoice);
                    return ResponseEntity.status(HttpStatus.CREATED).body(response);
                })
                .orElseGet(() -> {
                    response.put("success", false);
                    response.put("message", "Plan not found or invoice could not be generated");
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                });
    }
}
