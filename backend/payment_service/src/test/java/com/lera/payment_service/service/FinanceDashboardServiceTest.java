package com.lera.payment_service.service;

import com.lera.payment_service.entity.Refund;
import com.lera.payment_service.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FinanceDashboardServiceTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private InvoiceRepository invoiceRepository;
    @Mock private LedgerEntryRepository ledgerEntryRepository;
    @Mock private RefundRepository refundRepository;
    @Mock private StudentFeePlanRepository studentFeePlanRepository;
    @Mock private JdbcTemplate jdbcTemplate;

    @InjectMocks private FinanceDashboardService service;

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
        // invoice stats are now aggregated DB-side (countByStatus), not via findAll()
        when(invoiceRepository.count()).thenReturn(4L);
        when(invoiceRepository.countByStatus("PAID")).thenReturn(2L);
        when(invoiceRepository.countByStatus("PENDING")).thenReturn(1L);
        when(invoiceRepository.countByStatus("OVERDUE")).thenReturn(1L);
        when(invoiceRepository.countByStatus("CANCELLED")).thenReturn(0L);
        when(invoiceRepository.sumOutstanding()).thenReturn(new BigDecimal("500"));
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
        // PENDING + OVERDUE invoices outstanding = 500 (DB-aggregated)
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
        when(refundRepository.findByStatus("APPROVED")).thenReturn(List.of());
        when(studentFeePlanRepository.findByStatus("ACTIVE")).thenReturn(List.of());
        when(ledgerEntryRepository.getTotalCredits()).thenReturn(null);
        when(ledgerEntryRepository.getTotalDebits()).thenReturn(null);
        // count()/countByStatus()/sumOutstanding() left unstubbed -> Mockito returns 0L/null,
        // which the service must coerce to ZERO.

        Map<String, Object> s = service.getDashboardSummary(UUID.randomUUID());

        assertEquals(BigDecimal.ZERO, s.get("totalRevenue"));
        assertEquals(BigDecimal.ZERO, s.get("totalCredits"));
        assertEquals(BigDecimal.ZERO, s.get("totalDebits"));
        assertEquals(0, ((BigDecimal) s.get("netBalance")).compareTo(BigDecimal.ZERO));
        assertEquals(0, ((BigDecimal) s.get("outstandingAmount")).compareTo(BigDecimal.ZERO));
    }

    @Test
    void revenueByCenter_groupsPaidInvoicesAndSumsPerCenter() {
        // getRevenueByCenter() now aggregates per-centre in SQL (joins the centers table)
        when(jdbcTemplate.queryForList(anyString())).thenReturn(List.of(
                Map.of("centerId", UUID.randomUUID().toString(), "centerName", "Center A",
                        "totalRevenue", new BigDecimal("300")),
                Map.of("centerId", UUID.randomUUID().toString(), "centerName", "Center B",
                        "totalRevenue", new BigDecimal("50"))
        ));

        List<Map<String, Object>> result = service.getRevenueByCenter();

        assertEquals(2, result.size());
        BigDecimal total = result.stream()
                .map(m -> (BigDecimal) m.get("totalRevenue"))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(0, total.compareTo(new BigDecimal("350")));
    }
}
