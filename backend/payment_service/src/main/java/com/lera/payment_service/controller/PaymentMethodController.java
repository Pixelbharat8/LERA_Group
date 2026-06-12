package com.lera.payment_service.controller;

import com.lera.payment_service.entity.PaymentMethod;
import com.lera.payment_service.security.AuthUser;
import com.lera.payment_service.security.PaymentAccessService;
import com.lera.payment_service.service.JdbcAuditWriter;
import com.lera.payment_service.service.PaymentMethodService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/payment-methods")
@RequiredArgsConstructor
public class PaymentMethodController {

    private final PaymentMethodService paymentMethodService;
    private final JdbcAuditWriter auditWriter;
    private final PaymentAccessService paymentAccess;

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    @GetMapping
    public ResponseEntity<?> getAllMethods(
            @AuthenticationPrincipal AuthUser authUser,
            Pageable pageable) {
        paymentAccess.assertPrivilegedStaff(authUser);
        return ResponseEntity.ok(paymentMethodService.getAllMethods(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentMethod> getMethodById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return paymentMethodService.getMethodById(id)
                .map(m -> {
                    if (Boolean.TRUE.equals(m.getIsActive())) {
                        return ResponseEntity.ok(m);
                    }
                    paymentAccess.assertPrivilegedStaff(authUser);
                    return ResponseEntity.ok(m);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/active")
    public ResponseEntity<List<PaymentMethod>> getActiveMethods() {
        return ResponseEntity.ok(paymentMethodService.getActiveMethods());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<PaymentMethod> createMethod(@Valid @RequestBody PaymentMethod method) {
        PaymentMethod saved = paymentMethodService.createMethod(method);
        auditWriter.log("PAYMENT_METHOD_CREATED", "PaymentMethod", saved.getId(), null, null,
                "{\"methodCode\":\"" + esc(saved.getMethodCode()) + "\"}");
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<PaymentMethod> updateMethod(@PathVariable UUID id, @Valid @RequestBody PaymentMethod details) {
        Optional<PaymentMethod> oldOpt = paymentMethodService.getMethodById(id);
        return paymentMethodService.updateMethod(id, details)
                .map(updated -> {
                    oldOpt.ifPresent(old -> auditWriter.log("PAYMENT_METHOD_UPDATED", "PaymentMethod", id, null,
                            "{\"methodCode\":\"" + esc(old.getMethodCode()) + "\"}",
                            "{\"methodCode\":\"" + esc(updated.getMethodCode()) + "\"}"));
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Void> deleteMethod(@PathVariable UUID id) {
        Optional<PaymentMethod> oldOpt = paymentMethodService.getMethodById(id);
        boolean deleted = paymentMethodService.deleteMethod(id);
        if (deleted) {
            oldOpt.ifPresent(pm -> auditWriter.log("PAYMENT_METHOD_DELETED", "PaymentMethod", id, null,
                    "{\"methodName\":\"" + esc(pm.getMethodName()) + "\"}", null));
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
