package com.lera.payment_service.service;

import com.lera.payment_service.entity.Invoice;
import com.lera.payment_service.entity.StudentFeePlan;
import com.lera.payment_service.repository.InvoiceRepository;
import com.lera.payment_service.repository.StudentFeePlanRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentFeePlanServiceTest {

    @Mock private StudentFeePlanRepository studentFeePlanRepository;
    @Mock private InvoiceRepository invoiceRepository;
    @InjectMocks private StudentFeePlanService service;

    private void planExists(StudentFeePlan plan, UUID id) {
        when(studentFeePlanRepository.findById(id)).thenReturn(Optional.of(plan));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void generateInvoice_usesExplicitInstallmentAmount() {
        UUID id = UUID.randomUUID();
        StudentFeePlan plan = new StudentFeePlan();
        plan.setStudentId(UUID.randomUUID());
        plan.setInstallmentAmount(new BigDecimal("250.00"));
        plan.setTotalAmount(new BigDecimal("1000"));
        plan.setInstallments(4);
        planExists(plan, id);

        Invoice inv = service.generateInvoiceForPlan(id).orElseThrow();
        assertEquals(0, inv.getTotalAmount().compareTo(new BigDecimal("250.00")));
        assertEquals(0, inv.getSubtotal().compareTo(new BigDecimal("250.00")));
        assertEquals("PENDING", inv.getStatus());
        assertEquals(plan.getStudentId(), inv.getStudentId());
    }

    @Test
    void generateInvoice_dividesTotalByInstallmentsWhenNoInstallmentAmount() {
        UUID id = UUID.randomUUID();
        StudentFeePlan plan = new StudentFeePlan();
        plan.setTotalAmount(new BigDecimal("1000"));
        plan.setInstallments(3); // 1000 / 3 = 333.33 (HALF_UP, 2dp)
        planExists(plan, id);

        Invoice inv = service.generateInvoiceForPlan(id).orElseThrow();
        assertEquals(0, inv.getTotalAmount().compareTo(new BigDecimal("333.33")));
    }

    @Test
    void generateInvoice_defaultsToSingleInstallmentWhenCountMissing() {
        UUID id = UUID.randomUUID();
        StudentFeePlan plan = new StudentFeePlan();
        plan.setTotalAmount(new BigDecimal("750"));
        plan.setInstallments(null); // n defaults to 1
        planExists(plan, id);

        Invoice inv = service.generateInvoiceForPlan(id).orElseThrow();
        assertEquals(0, inv.getTotalAmount().compareTo(new BigDecimal("750.00")));
    }

    @Test
    void generateInvoice_fallsBackToZeroWhenNoAmounts() {
        UUID id = UUID.randomUUID();
        StudentFeePlan plan = new StudentFeePlan(); // no installment, no total
        planExists(plan, id);

        Invoice inv = service.generateInvoiceForPlan(id).orElseThrow();
        assertEquals(0, inv.getTotalAmount().compareTo(BigDecimal.ZERO));
    }

    @Test
    void generateInvoice_emptyWhenPlanNotFound() {
        when(studentFeePlanRepository.findById(any())).thenReturn(Optional.empty());
        assertTrue(service.generateInvoiceForPlan(UUID.randomUUID()).isEmpty());
    }
}
