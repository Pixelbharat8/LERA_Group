package com.lera.payment_service.controller;

import com.lera.payment_service.entity.Refund;
import com.lera.payment_service.security.AuthUser;
import com.lera.payment_service.security.PaymentAccessService;
import com.lera.payment_service.service.RefundService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/refunds")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;
    private final PaymentAccessService paymentAccess;

    @GetMapping
    public ResponseEntity<?> getAllRefunds(
            @AuthenticationPrincipal AuthUser authUser,
            Pageable pageable) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        paymentAccess.assertPrivilegedStaff(authUser);
        Page<Refund> page = refundService.getAllRefunds(pageable);
        if (!paymentAccess.isOrgWide(authUser.getRoleName())) {
            List<Refund> filtered = page.getContent().stream()
                    .filter(r -> paymentAccess.canViewPaymentId(authUser, r.getPaymentId()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(new PageImpl<>(filtered, pageable, filtered.size()));
        }
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Refund> getRefundById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return refundService.getRefundById(id)
                .filter(r -> paymentAccess.canViewPaymentId(authUser, r.getPaymentId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/payment/{paymentId}")
    public List<Refund> getRefundsByPaymentId(
            @PathVariable UUID paymentId,
            @AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null || !paymentAccess.canViewPaymentId(authUser, paymentId)) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return refundService.getRefundsByPayment(paymentId);
    }

    @GetMapping("/status/{status}")
    public List<Refund> getRefundsByStatus(
            @PathVariable String status,
            @AuthenticationPrincipal AuthUser authUser) {
        paymentAccess.assertPrivilegedStaff(authUser);
        return refundService.getRefundsByStatus(status);
    }

    @GetMapping("/pending")
    public List<Refund> getPendingRefunds(@AuthenticationPrincipal AuthUser authUser) {
        paymentAccess.assertPrivilegedStaff(authUser);
        return refundService.getRefundsByStatus("PENDING");
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public Refund createRefund(@Valid @RequestBody Refund refund) {
        return refundService.createRefund(refund);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<Refund> updateRefund(@PathVariable UUID id, @Valid @RequestBody Refund refundDetails) {
        return refundService.updateRefund(id, refundDetails)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<Refund> updateRefundStatus(@PathVariable UUID id, @Valid @RequestBody Map<String, String> body) {
        return refundService.updateRefundStatus(id, body.get("status"))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Refund> approveRefund(@PathVariable UUID id, @RequestBody(required = false) Map<String, Object> body) {
        return refundService.updateRefundStatus(id, "APPROVED")
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Refund> rejectRefund(@PathVariable UUID id, @RequestBody(required = false) Map<String, Object> body) {
        return refundService.updateRefundStatus(id, "REJECTED")
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/process")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','ACCOUNTANT')")
    public ResponseEntity<Refund> processRefund(@PathVariable UUID id) {
        return refundService.updateRefundStatus(id, "PROCESSING")
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','ACCOUNTANT')")
    public ResponseEntity<Refund> completeRefund(@PathVariable UUID id) {
        return refundService.updateRefundStatus(id, "COMPLETED")
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Void> deleteRefund(@PathVariable UUID id) {
        return refundService.deleteRefund(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
