package com.lera.payment_service.controller;

import com.lera.payment_service.entity.FeeReceipt;
import com.lera.payment_service.security.AuthUser;
import com.lera.payment_service.security.PaymentAccessService;
import com.lera.payment_service.service.FeeReceiptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/fee-receipts")
@RequiredArgsConstructor
public class FeeReceiptController {

    private final FeeReceiptService feeReceiptService;
    private final PaymentAccessService paymentAccess;

    @GetMapping
    public ResponseEntity<?> getAllReceipts(
            @AuthenticationPrincipal AuthUser authUser,
            Pageable pageable) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        paymentAccess.assertPrivilegedStaff(authUser);
        return ResponseEntity.ok(feeReceiptService.getAllReceipts(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FeeReceipt> getReceiptById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return feeReceiptService.getReceiptById(id)
                .filter(r -> paymentAccess.canViewStudentEntity(authUser, r.getStudentId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<FeeReceipt>> getReceiptsByStudent(
            @PathVariable UUID studentId,
            @AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        paymentAccess.assertCanViewStudentEntity(authUser, studentId);
        return ResponseEntity.ok(feeReceiptService.getReceiptsByStudent(studentId));
    }

    @GetMapping("/payment/{paymentId}")
    public ResponseEntity<List<FeeReceipt>> getReceiptsByPayment(
            @PathVariable UUID paymentId,
            @AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!paymentAccess.canViewPaymentId(authUser, paymentId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(feeReceiptService.getReceiptsByPayment(paymentId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<FeeReceipt> createReceipt(@Valid @RequestBody FeeReceipt receipt) {
        return ResponseEntity.ok(feeReceiptService.createReceipt(receipt));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Void> deleteReceipt(@PathVariable UUID id) {
        return feeReceiptService.deleteReceipt(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
