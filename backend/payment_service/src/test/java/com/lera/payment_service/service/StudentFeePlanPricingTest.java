package com.lera.payment_service.service;

import com.lera.payment_service.entity.StudentFeePlan;
import com.lera.payment_service.repository.StudentFeePlanRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * student_fee_plans has 25 columns; this entity mapped 10 of them, and four of the unmapped ones
 * are NOT NULL — center_id, plan_type, base_amount, final_amount. So creating a payment plan for
 * a student could not succeed at all:
 *
 *   ERROR: null value in column "center_id" of relation "student_fee_plans"
 *          violates not-null constraint
 *
 * The finance page had been posting planType, baseAmount, billingDay, courseId, autoRenew,
 * autoInvoice and notes the whole time; there was nothing on the entity to bind them to, so they
 * were dropped, and then the insert failed on the NOT NULL columns anyway.
 */
@ExtendWith(MockitoExtension.class)
class StudentFeePlanPricingTest {

    @Mock private StudentFeePlanRepository studentFeePlanRepository;
    @InjectMocks private StudentFeePlanService service;

    private StudentFeePlan plan(String base, String discount) {
        StudentFeePlan p = new StudentFeePlan();
        p.setStudentId(UUID.randomUUID());
        p.setCenterId(UUID.randomUUID());
        p.setPlanType("MONTHLY");
        p.setStartDate(LocalDate.now());
        p.setBaseAmount(new BigDecimal(base));
        if (discount != null) p.setDiscountAmount(new BigDecimal(discount));
        return p;
    }

    @Test
    void theFinalAmountIsDerivedFromTheBaseAndTheDiscount() {
        when(studentFeePlanRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        StudentFeePlan saved = service.createPlan(plan("5000000", "500000"));

        assertEquals(0, new BigDecimal("4500000").compareTo(saved.getFinalAmount()),
                "final_amount is NOT NULL and must be worked out, not left for the caller");
    }

    @Test
    void aFinalAmountThatContradictsItsPartsIsRejected() {
        StudentFeePlan p = plan("5000000", "500000");
        p.setFinalAmount(BigDecimal.ONE);

        assertThrows(IllegalArgumentException.class, () -> service.createPlan(p));
        verify(studentFeePlanRepository, never()).save(any());
    }

    @Test
    void aPlanWithNoCentreIsRefusedByName_notByConstraintViolation() {
        StudentFeePlan p = plan("5000000", null);
        p.setCenterId(null);

        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> service.createPlan(p));
        assertTrue(e.getMessage().contains("centre"), "the error should say what is missing: " + e.getMessage());
        verify(studentFeePlanRepository, never()).save(any());
    }

    @Test
    void aPlanWithNoAmountIsRefused() {
        StudentFeePlan p = plan("5000000", null);
        p.setBaseAmount(null);

        assertThrows(IllegalArgumentException.class, () -> service.createPlan(p));
    }
}
