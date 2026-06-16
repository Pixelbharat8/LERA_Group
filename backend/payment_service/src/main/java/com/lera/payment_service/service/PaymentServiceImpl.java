package com.lera.payment_service.service;

import com.lera.payment_service.entity.Payment;
import com.lera.payment_service.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PaymentServiceImpl {

    private final PaymentRepository paymentRepository;

    public Page<Payment> getAllPayments(Pageable pageable) {
        return paymentRepository.findAll(pageable);
    }

    public List<Payment> getPaymentsByCenter(UUID centerId) {
        return paymentRepository.findByCenterId(centerId);
    }

    public List<Payment> getPaymentsByStudent(UUID studentId) {
        return paymentRepository.findByStudentId(studentId);
    }

    public List<Payment> getPaymentsByStatus(String status) {
        return paymentRepository.findByStatus(status);
    }

    public List<Payment> getPaymentsByMethod(String paymentMethod) {
        return paymentRepository.findByPaymentMethodOrderByCreatedAtDesc(paymentMethod);
    }

    public List<Payment> getPaymentsByInvoice(UUID invoiceId) {
        return paymentRepository.findByInvoiceId(invoiceId);
    }

    public List<Payment> getPaymentsByUser(UUID userId) {
        List<Payment> studentPayments = paymentRepository.findByStudentId(userId);
        if (!studentPayments.isEmpty()) return studentPayments;
        return paymentRepository.findByProcessedBy(userId);
    }

    public Optional<Payment> getPaymentById(UUID id) {
        return paymentRepository.findById(id);
    }

    public Map<String, Object> getPaymentSummary(UUID centerId) {
        // DB-side aggregation per status — previously this loaded EVERY payment into memory
        // (the org-wide centerId==null path was a hard scale ceiling).
        Map<String, Object> summary = new HashMap<>();
        long completedCount, pendingCount, failedCount, refundedCount, totalCount;
        BigDecimal totalRevenue, pendingAmount;
        if (centerId != null) {
            completedCount = paymentRepository.countByCenterIdAndStatus(centerId, "COMPLETED");
            pendingCount = paymentRepository.countByCenterIdAndStatus(centerId, "PENDING");
            failedCount = paymentRepository.countByCenterIdAndStatus(centerId, "FAILED");
            refundedCount = paymentRepository.countByCenterIdAndStatus(centerId, "REFUNDED");
            totalCount = paymentRepository.countByCenterId(centerId);
            totalRevenue = paymentRepository.sumAmountByCenterAndStatus(centerId, "COMPLETED");
            pendingAmount = paymentRepository.sumAmountByCenterAndStatus(centerId, "PENDING");
            summary.put("centerId", centerId);
        } else {
            completedCount = paymentRepository.countByStatus("COMPLETED");
            pendingCount = paymentRepository.countByStatus("PENDING");
            failedCount = paymentRepository.countByStatus("FAILED");
            refundedCount = paymentRepository.countByStatus("REFUNDED");
            totalCount = paymentRepository.count();
            totalRevenue = paymentRepository.sumAmountByStatus("COMPLETED");
            pendingAmount = paymentRepository.sumAmountByStatus("PENDING");
        }
        summary.put("totalRevenue", totalRevenue != null ? totalRevenue : BigDecimal.ZERO);
        summary.put("pendingAmount", pendingAmount != null ? pendingAmount : BigDecimal.ZERO);
        summary.put("completedCount", completedCount);
        summary.put("pendingCount", pendingCount);
        summary.put("failedCount", failedCount);
        summary.put("refundedCount", refundedCount);
        summary.put("totalCount", totalCount);
        return summary;
    }

    @Transactional
    public Payment createPayment(Payment payment) {
        log.info("Creating payment: {} for student: {}", payment.getAmount(), payment.getStudentId());
        return paymentRepository.save(payment);
    }

    @Transactional
    public List<Payment> createPaymentsBulk(List<Payment> payments) {
        log.info("Creating {} payments in bulk", payments.size());
        return paymentRepository.saveAll(payments);
    }

    @Transactional
    public Optional<Payment> updatePayment(UUID id, Payment details) {
        return paymentRepository.findById(id).map(payment -> {
            if (details.getPaymentMethod() != null) payment.setPaymentMethod(details.getPaymentMethod());
            if (details.getAmount() != null) payment.setAmount(details.getAmount());
            if (details.getCurrency() != null) payment.setCurrency(details.getCurrency());
            if (details.getTransactionId() != null) payment.setTransactionId(details.getTransactionId());
            if (details.getPaymentGateway() != null) payment.setPaymentGateway(details.getPaymentGateway());
            if (details.getStatus() != null) payment.setStatus(details.getStatus());
            if (details.getNotes() != null) payment.setNotes(details.getNotes());
            if (details.getProcessedBy() != null) payment.setProcessedBy(details.getProcessedBy());
            return paymentRepository.save(payment);
        });
    }

    @Transactional
    public Optional<Payment> updatePaymentStatus(UUID id, String status) {
        return paymentRepository.findById(id).map(payment -> {
            payment.setStatus(status);
            if ("COMPLETED".equals(status)) {
                payment.setPaidAt(LocalDateTime.now());
            }
            return paymentRepository.save(payment);
        });
    }

    @Transactional
    public boolean deletePayment(UUID id) {
        return paymentRepository.findById(id).map(payment -> {
            paymentRepository.delete(payment);
            return true;
        }).orElse(false);
    }
}
