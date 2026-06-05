package com.lera.payment_service.controller;

import com.lera.payment_service.entity.LateFeeRule;
import com.lera.payment_service.security.AuthUser;
import com.lera.payment_service.security.PaymentAccessService;
import com.lera.payment_service.service.LateFeeRuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/late-fee-rules")
@RequiredArgsConstructor
public class LateFeeRuleController {

    private final LateFeeRuleService lateFeeRuleService;
    private final PaymentAccessService paymentAccess;

    @GetMapping
    public ResponseEntity<?> getAll(
            @AuthenticationPrincipal AuthUser authUser,
            Pageable pageable) {
        paymentAccess.assertPrivilegedStaff(authUser);
        return ResponseEntity.ok(lateFeeRuleService.getAllRules(pageable));
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActiveRules(@AuthenticationPrincipal AuthUser authUser) {
        paymentAccess.assertPrivilegedStaff(authUser);
        return ResponseEntity.ok(lateFeeRuleService.getActiveRules());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        paymentAccess.assertPrivilegedStaff(authUser);
        return lateFeeRuleService.getRuleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<?> create(@Valid @RequestBody LateFeeRule rule) {
        return ResponseEntity.ok(lateFeeRuleService.createRule(rule));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<?> update(@PathVariable UUID id, @Valid @RequestBody LateFeeRule rule) {
        return lateFeeRuleService.updateRule(id, rule)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<?> toggleActive(@PathVariable UUID id) {
        return lateFeeRuleService.toggleActive(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<?> delete(@PathVariable UUID id) {
        return lateFeeRuleService.deleteRule(id)
                ? ResponseEntity.ok(Map.of("success", true))
                : ResponseEntity.notFound().build();
    }
}
