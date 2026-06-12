package com.lera.payment_service.service;

import com.lera.payment_service.entity.Invoice;
import com.lera.payment_service.entity.StudentFeePlan;
import com.lera.payment_service.repository.InvoiceRepository;
import com.lera.payment_service.repository.StudentFeePlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class StudentFeePlanService {

    private final StudentFeePlanRepository studentFeePlanRepository;
    private final InvoiceRepository invoiceRepository;

    public Page<StudentFeePlan> getAllPlans(Pageable pageable) {
        return studentFeePlanRepository.findAll(pageable);
    }

    public Optional<StudentFeePlan> getPlanById(UUID id) {
        return studentFeePlanRepository.findById(id);
    }

    public List<StudentFeePlan> getPlansByStudent(UUID studentId) {
        return studentFeePlanRepository.findByStudentId(studentId);
    }

    public List<StudentFeePlan> getActivePlansByStudent(UUID studentId) {
        return studentFeePlanRepository.findByStudentIdAndStatus(studentId, "ACTIVE");
    }

    public List<StudentFeePlan> getPlansByStudentAndStatus(UUID studentId, String status) {
        return studentFeePlanRepository.findByStudentIdAndStatus(studentId, status);
    }

    public List<StudentFeePlan> getPlansByStatus(String status) {
        return studentFeePlanRepository.findByStatus(status);
    }

    @Transactional
    public StudentFeePlan createPlan(StudentFeePlan plan) {
        log.info("Creating fee plan for student: {}", plan.getStudentId());
        return studentFeePlanRepository.save(plan);
    }

    @Transactional
    public Optional<StudentFeePlan> updatePlan(UUID id, StudentFeePlan details) {
        return studentFeePlanRepository.findById(id).map(existing -> {
            details.setId(id);
            return studentFeePlanRepository.save(details);
        });
    }

    @Transactional
    public boolean deletePlan(UUID id) {
        if (studentFeePlanRepository.existsById(id)) {
            studentFeePlanRepository.deleteById(id);
            return true;
        }
        return false;
    }

    /** Toggle the lifecycle status (ACTIVE / SUSPENDED / etc.) of a plan. */
    @Transactional
    public Optional<StudentFeePlan> setStatus(UUID id, String status) {
        return studentFeePlanRepository.findById(id).map(plan -> {
            plan.setStatus(status);
            return studentFeePlanRepository.save(plan);
        });
    }

    /**
     * Create a new pending invoice for the next installment of this plan.
     * Amount = installmentAmount when present, otherwise totalAmount / installments.
     */
    @Transactional
    public Optional<Invoice> generateInvoiceForPlan(UUID planId) {
        return studentFeePlanRepository.findById(planId).map(plan -> {
            BigDecimal amount = plan.getInstallmentAmount();
            if (amount == null && plan.getTotalAmount() != null) {
                int n = plan.getInstallments() != null && plan.getInstallments() > 0
                        ? plan.getInstallments() : 1;
                amount = plan.getTotalAmount().divide(BigDecimal.valueOf(n), 2, java.math.RoundingMode.HALF_UP);
            }
            if (amount == null) {
                amount = BigDecimal.ZERO;
            }

            Invoice invoice = new Invoice();
            invoice.setStudentId(plan.getStudentId());
            invoice.setSubtotal(amount);
            invoice.setTotalAmount(amount);
            invoice.setStatus("PENDING");
            invoice.setDueDate(LocalDate.now().plusDays(14));
            invoice.setNotes("Auto-generated from fee plan " + planId);
            invoice.setCreatedAt(LocalDateTime.now());
            invoice.setUpdatedAt(LocalDateTime.now());
            return invoiceRepository.save(invoice);
        });
    }
}
