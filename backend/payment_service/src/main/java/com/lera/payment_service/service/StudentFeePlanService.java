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
        priceAndDefault(plan);
        return studentFeePlanRepository.save(plan);
    }

    /**
     * final_amount, plan_type and center_id are NOT NULL on this table. Derive what can be
     * derived and reject what cannot, so a bad request comes back as a 400 that names the
     * problem rather than a constraint violation.
     *
     * The final amount is computed from the parts rather than taken from the caller — the same
     * stance InvoiceServiceImpl takes on an invoice total — so a stated figure cannot disagree
     * with the base and discount it is made of.
     */
    private void priceAndDefault(StudentFeePlan plan) {
        if (plan.getCenterId() == null) {
            throw new IllegalArgumentException("A fee plan must say which centre it belongs to (centerId)");
        }
        if (plan.getPlanType() == null || plan.getPlanType().isBlank()) {
            throw new IllegalArgumentException("A fee plan must have a planType");
        }
        if (plan.getBaseAmount() == null) {
            throw new IllegalArgumentException("A fee plan must have a baseAmount");
        }
        java.math.BigDecimal discount = plan.getDiscountAmount() != null
                ? plan.getDiscountAmount() : java.math.BigDecimal.ZERO;
        java.math.BigDecimal computed = plan.getBaseAmount().subtract(discount);
        if (plan.getFinalAmount() != null && plan.getFinalAmount().compareTo(computed) != 0) {
            throw new IllegalArgumentException(
                    "Fee plan final amount " + plan.getFinalAmount() + " does not match base "
                            + plan.getBaseAmount() + " less discount " + discount + " = " + computed);
        }
        plan.setFinalAmount(computed);
        plan.setDiscountAmount(discount);
    }

    @Transactional
    public Optional<StudentFeePlan> updatePlan(UUID id, StudentFeePlan details) {
        return studentFeePlanRepository.findById(id).map(existing -> {
            details.setId(id);
            priceAndDefault(details);
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
