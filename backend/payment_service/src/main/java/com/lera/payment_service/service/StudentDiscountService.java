package com.lera.payment_service.service;

import com.lera.payment_service.entity.Discount;
import com.lera.payment_service.entity.StudentDiscount;
import com.lera.payment_service.repository.DiscountRepository;
import com.lera.payment_service.repository.StudentDiscountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class StudentDiscountService {

    private final StudentDiscountRepository studentDiscountRepository;
    private final DiscountRepository discountRepository;

    public Page<StudentDiscount> getAllStudentDiscounts(Pageable pageable) {
        return studentDiscountRepository.findAll(pageable);
    }

    public Optional<StudentDiscount> getById(UUID id) {
        return studentDiscountRepository.findById(id);
    }

    public List<StudentDiscount> getByStudent(UUID studentId) {
        return studentDiscountRepository.findByStudentId(studentId);
    }

    public List<StudentDiscount> getByDiscount(UUID discountId) {
        return studentDiscountRepository.findByDiscountId(discountId);
    }

    public List<StudentDiscount> getByStatus(String status) {
        return studentDiscountRepository.findByStatus(status);
    }

    public Optional<StudentDiscount> getByStudentAndDiscount(UUID studentId, UUID discountId) {
        return studentDiscountRepository.findByStudentIdAndDiscountId(studentId, discountId);
    }

    @Transactional
    public StudentDiscount create(StudentDiscount sd) {
        if (sd.getStudentId() == null) {
            throw new IllegalArgumentException("studentId is required");
        }
        if (sd.getDiscountId() == null) {
            throw new IllegalArgumentException("discountId is required");
        }

        // Dynamic, data-driven eligibility: validate against the discount's own configuration
        // rather than any hardcoded rule, so changing the discount changes what is allowed.
        Discount discount = discountRepository.findById(sd.getDiscountId())
                .orElseThrow(() -> new IllegalArgumentException("Discount not found: " + sd.getDiscountId()));

        if (Boolean.FALSE.equals(discount.getIsActive())) {
            throw new IllegalArgumentException("Discount is not active");
        }
        LocalDate today = LocalDate.now();
        if (discount.getValidFrom() != null && today.isBefore(discount.getValidFrom())) {
            throw new IllegalArgumentException("Discount is not yet valid");
        }
        if (discount.getValidTo() != null && today.isAfter(discount.getValidTo())) {
            throw new IllegalArgumentException("Discount has expired");
        }

        // No duplicate active assignment of the same discount to the same student.
        studentDiscountRepository.findByStudentIdAndDiscountId(sd.getStudentId(), sd.getDiscountId())
                .filter(existing -> !"INACTIVE".equalsIgnoreCase(existing.getStatus()))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Student already has this discount assigned");
                });

        // Enforce and account for the configured usage cap.
        if (discount.getMaxUses() != null) {
            int used = discount.getCurrentUses() != null ? discount.getCurrentUses() : 0;
            if (used >= discount.getMaxUses()) {
                throw new IllegalArgumentException("Discount usage limit reached");
            }
            discount.setCurrentUses(used + 1);
            discountRepository.save(discount);
        }

        log.info("Assigning discount {} to student {}", sd.getDiscountId(), sd.getStudentId());
        return studentDiscountRepository.save(sd);
    }

    @Transactional
    public Optional<StudentDiscount> update(UUID id, StudentDiscount details) {
        return studentDiscountRepository.findById(id).map(existing -> {
            details.setId(id);
            return studentDiscountRepository.save(details);
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (studentDiscountRepository.existsById(id)) {
            studentDiscountRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Transactional
    public Optional<StudentDiscount> toggleStatus(UUID id) {
        return studentDiscountRepository.findById(id).map(sd -> {
            String next = "ACTIVE".equalsIgnoreCase(sd.getStatus()) ? "INACTIVE" : "ACTIVE";
            sd.setStatus(next);
            return studentDiscountRepository.save(sd);
        });
    }
}
