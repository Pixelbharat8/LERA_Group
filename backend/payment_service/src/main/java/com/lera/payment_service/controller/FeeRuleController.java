package com.lera.payment_service.controller;

import com.lera.payment_service.entity.FeeRule;
import com.lera.payment_service.security.AuthUser;
import com.lera.payment_service.security.PaymentAccessService;
import com.lera.payment_service.service.FeeRuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/fee-rules")
@RequiredArgsConstructor
public class FeeRuleController {

    private final FeeRuleService feeRuleService;
    private final PaymentAccessService paymentAccess;

    @GetMapping
    public ResponseEntity<?> getAllFeeRules(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) UUID centerId,
            @RequestParam(required = false) Boolean active,
            Pageable pageable) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (centerId != null && Boolean.TRUE.equals(active)) {
            UUID effCenter = paymentAccess.isPrivilegedStaff(authUser.getRoleName())
                    ? paymentAccess.effectiveCenterId(authUser, centerId)
                    : centerId;
            return ResponseEntity.ok(feeRuleService.getActiveCenterRules(effCenter));
        }
        if (Boolean.TRUE.equals(active)) {
            return ResponseEntity.ok(feeRuleService.getActiveRules());
        }

        paymentAccess.assertPrivilegedStaff(authUser);
        if (centerId != null) {
            UUID effCenter = paymentAccess.effectiveCenterId(authUser, centerId);
            return ResponseEntity.ok(feeRuleService.getRulesByCenter(effCenter));
        }
        if (category != null) {
            return ResponseEntity.ok(feeRuleService.getRulesByCategory(category));
        }
        if (scope != null) {
            return ResponseEntity.ok(feeRuleService.getRulesByScope(scope));
        }
        return ResponseEntity.ok(feeRuleService.getAllRules(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FeeRule> getFeeRuleById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return feeRuleService.getRuleById(id)
                .map(rule -> {
                    if (Boolean.TRUE.equals(rule.getIsActive())) {
                        return ResponseEntity.ok(rule);
                    }
                    paymentAccess.assertPrivilegedStaff(authUser);
                    return ResponseEntity.ok(rule);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<FeeRule> createFeeRule(@Valid @RequestBody FeeRule feeRule) {
        return ResponseEntity.status(HttpStatus.CREATED).body(feeRuleService.createRule(feeRule));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<FeeRule> updateFeeRule(@PathVariable UUID id, @Valid @RequestBody FeeRule feeRule) {
        return feeRuleService.updateRule(id, feeRule)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Void> deleteFeeRule(@PathVariable UUID id) {
        return feeRuleService.deleteRule(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<FeeRule> toggleActive(@PathVariable UUID id) {
        return feeRuleService.toggleActive(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
