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
        List<Payment> payments = centerId != null
                ? paymentRepository.findByCenterId(centerId)
                : paymentRepository.findAll();

        Map<String, Object> summary = new HashMap<>();
        long completedCount = payments.stream().filter(p -> "COMPLETED".equals(p.getStatus())).count();
        long pendingCount = payments.stream().filter(p -> "PENDING".equals(p.getStatus())).count();
        long failedCount = payments.stream().filter(p -> "FAILED".equals(p.getStatus())).count();
        long refundedCount = payments.stream().filter(p -> "REFUNDED".equals(p.getStatus())).count();

        BigDecimal totalRevenue = payments.stream()
                .filter(p -> "COMPLETED".equals(p.getStatus()))
                .map(Payment::getAmount).filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pendingAmount = payments.stream()
                .filter(p -> "PENDING".equals(p.getStatus()))
                .map(Payment::getAmount).filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        summary.put("totalRevenue", totalRevenue);
        summary.put("pendingAmount", pendingAmount);
        summary.put("completedCount", completedCount);
        summary.put("pendingCount", pendingCount);
        summary.put("failedCount", failedCount);
        summary.put("refundedCount", refundedCount);
        summary.put("totalCount", payments.size());
        if (centerId != null) summary.put("centerId", centerId);
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
