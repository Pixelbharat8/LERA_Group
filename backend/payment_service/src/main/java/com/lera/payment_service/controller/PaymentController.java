package com.lera.payment_service.controller;

import com.lera.payment_service.entity.Payment;
import com.lera.payment_service.security.AuthUser;
import com.lera.payment_service.security.PaymentAccessService;
import com.lera.payment_service.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentAccessService paymentAccess;

    @GetMapping
    public ResponseEntity<List<Payment>> getAllPayments(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam(required = false) UUID centerId,
            @RequestParam(required = false) UUID studentId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentMethod) {
        if (authUser == null || authUser.getUserId() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (paymentAccess.isPrivilegedStaff(authUser.getRoleName())) {
            UUID effCenter = paymentAccess.effectiveCenterId(authUser, centerId);
            if (studentId != null) {
                return ResponseEntity.ok(paymentService.getByStudent(studentId));
            }
            if (effCenter != null) {
                return ResponseEntity.ok(paymentService.getByCenter(effCenter));
            }
            if (status != null) {
                return ResponseEntity.ok(paymentService.getByStatus(status));
            }
            if (paymentMethod != null) {
                return ResponseEntity.ok(paymentService.getByPaymentMethod(paymentMethod));
            }
            if (!paymentAccess.isOrgWide(authUser.getRoleName())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Specify centerId, studentId, status, or paymentMethod");
            }
            return ResponseEntity.ok(paymentService.getFiltered(null, null, null, null));
        }

        String role = authUser.getRoleName();
        if (role != null && "PARENT".equalsIgnoreCase(role)) {
            if (centerId != null || status != null || paymentMethod != null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (studentId != null) {
                if (!paymentAccess.isParentOfStudent(authUser.getUserId(), studentId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
                return ResponseEntity.ok(paymentService.getByStudent(studentId));
            }
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (role != null && "STUDENT".equalsIgnoreCase(role)) {
            if (centerId != null || status != null || paymentMethod != null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Optional<UUID> ownStudentId = paymentAccess.findStudentIdForUser(authUser.getUserId());
            if (ownStudentId.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }
            if (studentId != null && !studentId.equals(ownStudentId.get())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            return ResponseEntity.ok(paymentService.getByStudent(ownStudentId.get()));
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Payment>> getPaymentsByStudent(
            @PathVariable UUID studentId,
            @AuthenticationPrincipal AuthUser authUser) {
        return getAllPayments(authUser, null, studentId, null, null);
    }

    @GetMapping("/center/{centerId}")
    public ResponseEntity<List<Payment>> getPaymentsByCenter(
            @PathVariable UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        return getAllPayments(authUser, centerId, null, null, null);
    }

    @GetMapping("/center/{centerId}/summary")
    public ResponseEntity<Map<String, Object>> getCenterPaymentSummary(
            @PathVariable UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!paymentAccess.isPrivilegedStaff(authUser.getRoleName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        paymentAccess.effectiveCenterId(authUser, centerId);
        return ResponseEntity.ok(paymentService.getCenterSummary(centerId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Payment>> getPaymentsByUser(
            @PathVariable UUID userId,
            @AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null
                || (!authUser.getUserId().equals(userId)
                        && !paymentAccess.isPrivilegedStaff(authUser.getRoleName()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(paymentService.getByUser(userId));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getPaymentSummary(
            @RequestParam(required = false) UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!paymentAccess.isPrivilegedStaff(authUser.getRoleName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        UUID eff = paymentAccess.effectiveCenterId(authUser, centerId);
        return ResponseEntity.ok(paymentService.getSummary(eff));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPaymentById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return paymentService.getById(id)
                .map(p -> {
                    if (!paymentAccess.canViewPayment(authUser, p)) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
                    }
                    return ResponseEntity.ok(p);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/invoice/{invoiceId}")
    public ResponseEntity<List<Payment>> getPaymentsByInvoiceId(
            @PathVariable UUID invoiceId,
            @AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null || !paymentAccess.isPrivilegedStaff(authUser.getRoleName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(paymentService.getByInvoice(invoiceId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Payment>> getPaymentsByStatus(
            @PathVariable String status,
            @AuthenticationPrincipal AuthUser authUser) {
        return getAllPayments(authUser, null, null, status, null);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public Payment createPayment(@Valid @RequestBody Payment payment) {
        return paymentService.create(payment);
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public List<Payment> createPaymentsBulk(@Valid @RequestBody List<Payment> payments) {
        return paymentService.createBulk(payments);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<Payment> updatePayment(
            @PathVariable UUID id,
            @Valid @RequestBody Payment paymentDetails) {
        return paymentService.update(id, paymentDetails)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<Payment> updatePaymentStatus(
            @PathVariable UUID id,
            @Valid @RequestBody Map<String, String> request) {
        return paymentService.updateStatus(id, request.get("status"))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Void> deletePayment(@PathVariable UUID id) {
        return paymentService.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
