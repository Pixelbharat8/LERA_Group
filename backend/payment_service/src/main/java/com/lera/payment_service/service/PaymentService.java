package com.lera.payment_service.service;

import com.lera.payment_service.entity.Payment;
import com.lera.payment_service.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PaymentService {

    private final PaymentRepository paymentRepository;

    @Cacheable(value = "payments", key = "'all'")
    public List<Payment> getAll() {
        return paymentRepository.findAllByOrderByCreatedAtDesc();
    }

    @Cacheable(value = "payments", key = "#id")
    public Optional<Payment> getById(UUID id) {
        return paymentRepository.findById(id);
    }

    @Cacheable(value = "payments", key = "'student-' + #studentId")
    public List<Payment> getByStudent(UUID studentId) {
        return paymentRepository.findByStudentId(studentId);
    }

    @Cacheable(value = "payments", key = "'center-' + #centerId")
    public List<Payment> getByCenter(UUID centerId) {
        return paymentRepository.findByCenterId(centerId);
    }

    @Cacheable(value = "payments", key = "'status-' + #status")
    public List<Payment> getByStatus(String status) {
        return paymentRepository.findByStatus(status);
    }

    @Cacheable(value = "payments", key = "'paymentMethod-' + #paymentMethod")
    public List<Payment> getByPaymentMethod(String paymentMethod) {
        return paymentRepository.findByPaymentMethodOrderByCreatedAtDesc(paymentMethod);
    }

    @Cacheable(value = "payments", key = "'invoice-' + #invoiceId")
    public List<Payment> getByInvoice(UUID invoiceId) {
        return paymentRepository.findByInvoiceId(invoiceId);
    }

    public List<Payment> getByUser(UUID userId) {
        List<Payment> studentPayments = paymentRepository.findByStudentId(userId);
        if (!studentPayments.isEmpty()) return studentPayments;
        return paymentRepository.findByProcessedBy(userId);
    }

    public List<Payment> getFiltered(UUID centerId, UUID studentId, String status, String paymentMethod) {
        if (centerId != null) return paymentRepository.findByCenterId(centerId);
        if (studentId != null) return paymentRepository.findByStudentId(studentId);
        if (status != null) return paymentRepository.findByStatus(status);
        if (paymentMethod != null) return paymentRepository.findByPaymentMethodOrderByCreatedAtDesc(paymentMethod);
        return paymentRepository.findAllByOrderByCreatedAtDesc();
    }

    public Map<String, Object> getSummary(UUID centerId) {
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
        return summary;
    }

    public Map<String, Object> getCenterSummary(UUID centerId) {
        List<Payment> payments = paymentRepository.findByCenterId(centerId);
        Map<String, Object> summary = new HashMap<>();

        long completedCount = payments.stream().filter(p -> "COMPLETED".equals(p.getStatus())).count();
        long pendingCount = payments.stream().filter(p -> "PENDING".equals(p.getStatus())).count();

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
        summary.put("totalCount", payments.size());
        summary.put("centerId", centerId);
        return summary;
    }

    @CacheEvict(value = "payments", allEntries = true)
    @Transactional
    public Payment create(Payment payment) {
        log.info("Creating payment for student: {}", payment.getStudentId());
        return paymentRepository.save(payment);
    }

    @CacheEvict(value = "payments", allEntries = true)
    @Transactional
    public List<Payment> createBulk(List<Payment> payments) {
        log.info("Creating {} payments in bulk", payments.size());
        return paymentRepository.saveAll(payments);
    }

    @CacheEvict(value = "payments", allEntries = true)
    @Transactional
    public Optional<Payment> update(UUID id, Payment details) {
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

    @CacheEvict(value = "payments", allEntries = true)
    @Transactional
    public Optional<Payment> updateStatus(UUID id, String status) {
        return paymentRepository.findById(id).map(payment -> {
            payment.setStatus(status);
            if ("COMPLETED".equals(status)) {
                payment.setPaidAt(LocalDateTime.now());
            }
            return paymentRepository.save(payment);
        });
    }

    @CacheEvict(value = "payments", allEntries = true)
    @Transactional
    public boolean delete(UUID id) {
        return paymentRepository.findById(id).map(payment -> {
            paymentRepository.delete(payment);
            return true;
        }).orElse(false);
    }
}
