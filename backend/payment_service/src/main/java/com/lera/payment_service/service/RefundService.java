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

        // (b) Amount must be strictly positive.
        BigDecimal amount = refund.getAmount();
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("Refund amount must be greater than zero");
        }

        // (c) Total refunds for this payment must not exceed the original payment amount.
        BigDecimal alreadyRefunded = refundRepository.findByPaymentId(payment.getId()).stream()
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

        log.info("Creating refund of {} for payment: {}", amount, refund.getPaymentId());
        return refundRepository.save(refund);
    }

    @Transactional
    public Optional<Refund> updateRefund(UUID id, Refund details) {
        return refundRepository.findById(id).map(existing -> {
            details.setId(id);
            return refundRepository.save(details);
        });
    }

    @Transactional
    public Optional<Refund> updateRefundStatus(UUID id, String status) {
        return refundRepository.findById(id).map(refund -> {
            refund.setStatus(status);
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
