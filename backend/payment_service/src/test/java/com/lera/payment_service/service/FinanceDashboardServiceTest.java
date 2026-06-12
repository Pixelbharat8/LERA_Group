package com.lera.payment_service.service;

import com.lera.payment_service.entity.Invoice;
import com.lera.payment_service.entity.Refund;
import com.lera.payment_service.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FinanceDashboardServiceTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private InvoiceRepository invoiceRepository;
    @Mock private LedgerEntryRepository ledgerEntryRepository;
    @Mock private RefundRepository refundRepository;
    @Mock private StudentFeePlanRepository studentFeePlanRepository;

    @InjectMocks private FinanceDashboardService service;

    private static Invoice invoice(String status, String amount, UUID centerId) {
        Invoice i = new Invoice();
        i.setStatus(status);
        i.setTotalAmount(amount == null ? null : new BigDecimal(amount));
        i.setCenterId(centerId);
        return i;
    }

    private static Refund refund(String amount) {
        Refund r = new Refund();
        r.setStatus("APPROVED");
        r.setAmount(new BigDecimal(amount));
        return r;
    }

    @Test
    void dashboardSummary_aggregatesStatusesAmountsAndBalance() {
        when(paymentRepository.getTotalRevenue()).thenReturn(new BigDecimal("1000"));
        when(paymentRepository.countByStatus("PENDING")).thenReturn(2L);
        when(paymentRepository.countByStatus("COMPLETED")).thenReturn(5L);
        when(paymentRepository.countByStatus("FAILED")).thenReturn(1L);
        when(invoiceRepository.findAll()).thenReturn(List.of(
                invoice("PAID", "500", null),
                invoice("PAID", "100", null),
                invoice("PENDING", "300", null),   // outstanding
                invoice("OVERDUE", "200", null)     // outstanding
        ));
        when(refundRepository.findByStatus("APPROVED")).thenReturn(List.of(refund("50"), refund("30")));
        when(studentFeePlanRepository.findByStatus("ACTIVE")).thenReturn(List.of(
                new com.lera.payment_service.entity.StudentFeePlan(),
                new com.lera.payment_service.entity.StudentFeePlan(),
                new com.lera.payment_service.entity.StudentFeePlan()));
        when(ledgerEntryRepository.getTotalCredits()).thenReturn(new BigDecimal("900"));
        when(ledgerEntryRepository.getTotalDebits()).thenReturn(new BigDecimal("400"));

        Map<String, Object> s = service.getDashboardSummary(UUID.randomUUID());

        assertEquals(new BigDecimal("1000"), s.get("totalRevenue"));
        assertEquals(2L, s.get("pendingPayments"));
        assertEquals(5L, s.get("completedPayments"));
        assertEquals(1L, s.get("failedPayments"));
        // only PENDING + OVERDUE invoices are outstanding: 300 + 200
        assertEquals(0, ((BigDecimal) s.get("outstandingAmount")).compareTo(new BigDecimal("500")));
        // approved refunds: 50 + 30
        assertEquals(0, ((BigDecimal) s.get("refundedAmount")).compareTo(new BigDecimal("80")));
        // netBalance = credits - debits = 900 - 400
        assertEquals(0, ((BigDecimal) s.get("netBalance")).compareTo(new BigDecimal("500")));
        assertEquals(3L, s.get("activePlans"));

        @SuppressWarnings("unchecked")
        Map<String, Long> stats = (Map<String, Long>) s.get("invoiceStats");
        assertEquals(2L, stats.get("paid"));
        assertEquals(1L, stats.get("pending"));
        assertEquals(1L, stats.get("overdue"));
        assertEquals(0L, stats.get("cancelled"));
        assertEquals(4L, stats.get("total"));
    }

    @Test
    void dashboardSummary_handlesNullAggregatesAsZero() {
        when(paymentRepository.getTotalRevenue()).thenReturn(null);
        when(invoiceRepository.findAll()).thenReturn(List.of());
        when(refundRepository.findByStatus("APPROVED")).thenReturn(List.of());
        when(studentFeePlanRepository.findByStatus("ACTIVE")).thenReturn(List.of());
        when(ledgerEntryRepository.getTotalCredits()).thenReturn(null);
        when(ledgerEntryRepository.getTotalDebits()).thenReturn(null);

        Map<String, Object> s = service.getDashboardSummary(UUID.randomUUID());

        assertEquals(BigDecimal.ZERO, s.get("totalRevenue"));
        assertEquals(BigDecimal.ZERO, s.get("totalCredits"));
        assertEquals(BigDecimal.ZERO, s.get("totalDebits"));
        assertEquals(0, ((BigDecimal) s.get("netBalance")).compareTo(BigDecimal.ZERO));
        assertEquals(0, ((BigDecimal) s.get("outstandingAmount")).compareTo(BigDecimal.ZERO));
    }

    @Test
    void revenueByCenter_groupsPaidInvoicesAndSumsPerCenter() {
        UUID centerA = UUID.randomUUID();
        UUID centerB = UUID.randomUUID();
        when(invoiceRepository.findByStatus("PAID")).thenReturn(List.of(
                invoice("PAID", "100", centerA),
                invoice("PAID", "200", centerA),
                invoice("PAID", "50", centerB)
        ));

        List<Map<String, Object>> result = service.getRevenueByCenter();

        assertEquals(2, result.size());
        BigDecimal total = result.stream()
                .map(m -> (BigDecimal) m.get("totalRevenue"))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(0, total.compareTo(new BigDecimal("350")));
    }
}
