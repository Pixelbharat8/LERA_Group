package com.lera.payment_service.service;

import com.lera.payment_service.entity.Payment;
import com.lera.payment_service.entity.Refund;
import com.lera.payment_service.repository.PaymentRepository;
import com.lera.payment_service.repository.RefundRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class RefundService {

    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;

    /** Refund statuses that count against the payment's refundable balance. */
    private static final List<String> ACTIVE_REFUND_STATUSES =
            List.of("PENDING", "APPROVED", "PROCESSING", "COMPLETED");

    public Page<Refund> getAllRefunds(Pageable pageable) {
        return refundRepository.findAll(pageable);
    }

    public Optional<Refund> getRefundById(UUID id) {
        return refundRepository.findById(id);
    }

    public List<Refund> getRefundsByPayment(UUID paymentId) {
        return refundRepository.findByPaymentId(paymentId);
    }

    public List<Refund> getRefundsByStatus(String status) {
        return refundRepository.findByStatus(status);
    }

    @Transactional
    public Refund createRefund(Refund refund) {
        // (a) Refund must reference an existing payment.
        if (refund.getPaymentId() == null) {
            throw new IllegalArgumentException("paymentId is required");
        }
        Payment payment = paymentRepository.findById(refund.getPaymentId())
                .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + refund.getPaymentId()));
        // (b) positive amount + (c) total refunds must not exceed the paid amount.
        assertWithinRefundableBalance(payment, refund.getAmount(), null);
        log.info("Creating refund of {} for payment: {}", refund.getAmount(), refund.getPaymentId());
        return refundRepository.save(refund);
    }

    /**
     * Enforce: amount > 0 AND (sum of active refunds for this payment, excluding {@code excludeRefundId})
     * + amount ≤ the payment amount. Used by BOTH create and update so an inflated PUT can't over-refund.
     */
    private void assertWithinRefundableBalance(Payment payment, BigDecimal amount, UUID excludeRefundId) {
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("Refund amount must be greater than zero");
        }
        BigDecimal alreadyRefunded = refundRepository.findByPaymentId(payment.getId()).stream()
                .filter(r -> excludeRefundId == null || !excludeRefundId.equals(r.getId()))
                .filter(r -> r.getStatus() == null || ACTIVE_REFUND_STATUSES.contains(r.getStatus().toUpperCase()))
                .map(Refund::getAmount)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal paymentAmount = payment.getAmount() != null ? payment.getAmount() : BigDecimal.ZERO;
        if (alreadyRefunded.add(amount).compareTo(paymentAmount) > 0) {
            throw new IllegalArgumentException(
                    "Refund exceeds refundable balance. Paid: " + paymentAmount
                            + ", already refunded: " + alreadyRefunded + ", requested: " + amount);
        }
    }

    @Transactional
    public Optional<Refund> updateRefund(UUID id, Refund details) {
        return refundRepository.findById(id).map(existing -> {
            // Re-validate the cap on edit — otherwise a valid small refund could be PUT-inflated
            // past the paid amount. Payment is the existing one unless explicitly re-pointed.
            UUID paymentId = details.getPaymentId() != null ? details.getPaymentId() : existing.getPaymentId();
            Payment payment = paymentRepository.findById(paymentId)
                    .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + paymentId));
            assertWithinRefundableBalance(payment, details.getAmount(), id);
            details.setId(id);
            return refundRepository.save(details);
        });
    }

    /** Allowed refund status transitions. Terminal states (COMPLETED/REJECTED) accept nothing. */
    private static final java.util.Map<String, java.util.Set<String>> ALLOWED_TRANSITIONS = java.util.Map.of(
            "PENDING", java.util.Set.of("APPROVED", "REJECTED"),
            "APPROVED", java.util.Set.of("PROCESSING", "COMPLETED", "REJECTED"),
            "PROCESSING", java.util.Set.of("COMPLETED", "REJECTED"),
            "COMPLETED", java.util.Set.of(),
            "REJECTED", java.util.Set.of());

    @Transactional
    public Optional<Refund> updateRefundStatus(UUID id, String status) {
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("status is required");
        }
        String next = status.trim().toUpperCase();
        return refundRepository.findById(id).map(refund -> {
            String current = refund.getStatus() == null ? "PENDING" : refund.getStatus().toUpperCase();
            if (current.equals(next)) {
                return refund; // idempotent no-op
            }
            // State-machine guard — blocks re-approve, approve-after-reject, and COMPLETED↔PENDING,
            // so an already-paid/rejected refund can't be flipped back and re-processed for money.
            if (!ALLOWED_TRANSITIONS.getOrDefault(current, java.util.Set.of()).contains(next)) {
                throw new IllegalArgumentException("Invalid refund transition: " + current + " → " + next);
            }
            refund.setStatus(next);
            return refundRepository.save(refund);
        });
    }

    @Transactional
    public boolean deleteRefund(UUID id) {
        if (refundRepository.existsById(id)) {
            refundRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
