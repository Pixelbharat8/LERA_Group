package com.lera.payment_service.service;

import com.lera.payment_service.entity.Invoice;
import com.lera.payment_service.entity.Refund;
import com.lera.payment_service.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class FinanceDashboardService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final RefundRepository refundRepository;
    private final StudentFeePlanRepository studentFeePlanRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    /**
     * Real completed-revenue trend for the last 12 calendar months (gaps filled with 0),
     * optionally scoped to a center. Backs the finance dashboard's monthly chart.
     */
    public List<Map<String, Object>> getMonthlyRevenue(UUID centerId) {
        int months = 12;
        LocalDate startMonth = LocalDate.now().withDayOfMonth(1).minusMonths(months - 1L);
        LocalDateTime start = startMonth.atStartOfDay();
        List<Object[]> rows = centerId != null
                ? paymentRepository.monthlyRevenueByCenterSince(centerId, start)
                : paymentRepository.monthlyRevenueSince(start);
        Map<String, BigDecimal> byYm = new HashMap<>();
        for (Object[] r : rows) {
            if (r[0] == null) continue;
            byYm.put(String.valueOf(r[0]), r[1] == null ? BigDecimal.ZERO : new BigDecimal(r[1].toString()));
        }
        DateTimeFormatter ymFmt = DateTimeFormatter.ofPattern("yyyy-MM");
        DateTimeFormatter labelFmt = DateTimeFormatter.ofPattern("MMM");
        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 0; i < months; i++) {
            LocalDate m = startMonth.plusMonths(i);
            Map<String, Object> e = new LinkedHashMap<>();
            e.put("month", m.format(labelFmt));
            e.put("revenue", byYm.getOrDefault(m.format(ymFmt), BigDecimal.ZERO));
            result.add(e);
        }
        return result;
    }

    public Map<String, Object> getDashboardSummary(UUID centerId) {
        Map<String, Object> summary = new HashMap<>();
        
        BigDecimal totalRevenue = paymentRepository.getTotalRevenue();
        summary.put("totalRevenue", totalRevenue != null ? totalRevenue : BigDecimal.ZERO);
        // Real current-month revenue (was incorrectly shown as the all-time total on the dashboard).
        BigDecimal thisMonth = paymentRepository.sumCompletedSince(LocalDate.now().withDayOfMonth(1).atStartOfDay());
        summary.put("thisMonthRevenue", thisMonth != null ? thisMonth : BigDecimal.ZERO);
        summary.put("pendingPayments", paymentRepository.countByStatus("PENDING"));
        summary.put("completedPayments", paymentRepository.countByStatus("COMPLETED"));
        summary.put("failedPayments", paymentRepository.countByStatus("FAILED"));
        long totalInvoices = invoiceRepository.count();
        summary.put("totalInvoices", totalInvoices);

        // DB-side aggregation — previously this loaded the entire invoices table into memory.
        Map<String, Long> invoiceStats = new HashMap<>();
        invoiceStats.put("total", totalInvoices);
        invoiceStats.put("paid", invoiceRepository.countByStatus("PAID"));
        invoiceStats.put("pending", invoiceRepository.countByStatus("PENDING"));
        invoiceStats.put("overdue", invoiceRepository.countByStatus("OVERDUE"));
        invoiceStats.put("cancelled", invoiceRepository.countByStatus("CANCELLED"));
        summary.put("invoiceStats", invoiceStats);

        BigDecimal outstandingAmount = invoiceRepository.sumOutstanding();
        summary.put("outstandingAmount", outstandingAmount != null ? outstandingAmount : BigDecimal.ZERO);

        List<Refund> approvedRefunds = refundRepository.findByStatus("APPROVED");
        BigDecimal refundedAmount = approvedRefunds.stream()
                .map(r -> r.getAmount() != null ? r.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        summary.put("refundedAmount", refundedAmount);

        long activePlans = studentFeePlanRepository.findByStatus("ACTIVE").size();
        summary.put("activePlans", activePlans);

        BigDecimal totalCredits = ledgerEntryRepository.getTotalCredits();
        BigDecimal totalDebits = ledgerEntryRepository.getTotalDebits();
        summary.put("totalCredits", totalCredits != null ? totalCredits : BigDecimal.ZERO);
        summary.put("totalDebits", totalDebits != null ? totalDebits : BigDecimal.ZERO);
        summary.put("netBalance", (totalCredits != null ? totalCredits : BigDecimal.ZERO)
                .subtract(totalDebits != null ? totalDebits : BigDecimal.ZERO));
        
        return summary;
    }

    public List<Map<String, Object>> getRevenueByCenter() {
        // Join the centres table (shared DB) for REAL names instead of the UUID-derived
        // "Center c0000000" placeholder, and EXCLUDE soft-deleted centres so the breakdown
        // matches Centers Management (which also hides DELETED). Outstanding/collected are
        // computed per centre so the UI bars are accurate.
        return jdbcTemplate.queryForList(
                "SELECT CAST(c.id AS varchar) AS \"centerId\", c.name AS \"centerName\", " +
                "COALESCE(SUM(CASE WHEN UPPER(i.status)='PAID' THEN i.total_amount ELSE 0 END),0) AS \"totalRevenue\", " +
                "COALESCE(SUM(CASE WHEN UPPER(i.status) IN ('PENDING','OVERDUE') THEN i.total_amount ELSE 0 END),0) AS \"outstanding\", " +
                "COUNT(DISTINCT i.student_id) AS \"studentCount\", COUNT(i.id) AS \"invoiceCount\" " +
                "FROM centers c LEFT JOIN invoices i ON i.center_id = c.id " +
                "WHERE c.status IS NULL OR UPPER(c.status) <> 'DELETED' " +
                "GROUP BY c.id, c.name ORDER BY \"totalRevenue\" DESC");
    }

    public Map<String, Object> getRevenueByCenterId(UUID centerId) {
        List<Invoice> centerInvoices = invoiceRepository.findByCenterId(centerId);
        BigDecimal totalRevenue = centerInvoices.stream()
                .filter(i -> "PAID".equalsIgnoreCase(i.getStatus()))
                .map(i -> i.getTotalAmount() != null ? i.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal pendingAmount = centerInvoices.stream()
                .filter(i -> "PENDING".equalsIgnoreCase(i.getStatus()))
                .map(i -> i.getTotalAmount() != null ? i.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal overdueAmount = centerInvoices.stream()
                .filter(i -> "OVERDUE".equalsIgnoreCase(i.getStatus()))
                .map(i -> i.getTotalAmount() != null ? i.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long total = centerInvoices.size();
        long paid = centerInvoices.stream().filter(i -> "PAID".equalsIgnoreCase(i.getStatus())).count();
        long pending = centerInvoices.stream().filter(i -> "PENDING".equalsIgnoreCase(i.getStatus())).count();
        long overdue = centerInvoices.stream().filter(i -> "OVERDUE".equalsIgnoreCase(i.getStatus())).count();

        Map<String, Object> result = new HashMap<>();
        result.put("centerId", centerId.toString());
        result.put("totalRevenue", totalRevenue);
        result.put("pendingAmount", pendingAmount);
        result.put("overdueAmount", overdueAmount);
        result.put("outstandingAmount", pendingAmount.add(overdueAmount));
        result.put("totalInvoices", total);
        result.put("paidInvoices", paid);
        result.put("pendingInvoices", pending);
        result.put("overdueInvoices", overdue);
        result.put("collectionRate", total > 0 ? (paid * 100.0 / total) : 0);
        return result;
    }

    /**
     * Real completed-revenue total for a named period ({@code month|quarter|year}) anchored to
     * {@code year}, plus genuine period-over-period growth % vs the immediately preceding window.
     * Org-wide when {@code centerId} is null, otherwise scoped to that centre. Backs
     * {@code GET /api/finance/revenue} (the CEO finance page reads {@code total} and {@code growth}).
     */
    public Map<String, Object> getRevenueSummary(String period, Integer year, UUID centerId) {
        LocalDate now = LocalDate.now();
        int y = (year != null) ? year : now.getYear();
        String p = (period == null) ? "year" : period.toLowerCase();

        LocalDate start;
        LocalDate end;
        switch (p) {
            case "month": {
                // Latest month within the chosen year (current month if that year is ongoing, else December).
                int m = (y == now.getYear()) ? now.getMonthValue() : 12;
                start = LocalDate.of(y, m, 1);
                end = start.plusMonths(1);
                break;
            }
            case "quarter": {
                int qStartMonth = (y == now.getYear()) ? ((now.getMonthValue() - 1) / 3) * 3 + 1 : 10;
                start = LocalDate.of(y, qStartMonth, 1);
                end = start.plusMonths(3);
                break;
            }
            case "year":
            default: {
                start = LocalDate.of(y, 1, 1);
                end = start.plusYears(1);
                p = "year";
            }
        }
        // Previous window of equal length, immediately before `start`.
        long days = java.time.temporal.ChronoUnit.DAYS.between(start, end);
        LocalDate prevStart = start.minusDays(days);

        BigDecimal current = sumCompletedBetween(start, end, centerId);
        BigDecimal previous = sumCompletedBetween(prevStart, start, centerId);

        double growth;
        if (previous.signum() > 0) {
            growth = current.subtract(previous)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(previous, 1, java.math.RoundingMode.HALF_UP)
                    .doubleValue();
        } else {
            growth = current.signum() > 0 ? 100.0 : 0.0;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", current);
        result.put("growth", growth);
        result.put("previous", previous);
        result.put("period", p);
        result.put("year", y);
        result.put("startDate", start.toString());
        result.put("endDate", end.minusDays(1).toString());
        return result;
    }

    private BigDecimal sumCompletedBetween(LocalDate start, LocalDate end, UUID centerId) {
        BigDecimal v = centerId != null
                ? paymentRepository.sumCompletedByCenterBetween(centerId, start.atStartOfDay(), end.atStartOfDay())
                : paymentRepository.sumCompletedBetween(start.atStartOfDay(), end.atStartOfDay());
        return v != null ? v : BigDecimal.ZERO;
    }

    /**
     * Operating expenses for a period. NOTE: payment_service has no expense/cost data source
     * (no Expense entity or table — only incoming student payments). Rather than fabricate a
     * number, this honestly returns 0 until an expense-tracking module is added. The CEO finance
     * page renders this as the real "no expenses recorded yet" state instead of erroring.
     */
    public Map<String, Object> getExpenseSummary(String period, Integer year, UUID centerId) {
        LocalDate now = LocalDate.now();
        int y = (year != null) ? year : now.getYear();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", BigDecimal.ZERO);
        result.put("period", period == null ? "year" : period.toLowerCase());
        result.put("year", y);
        result.put("tracked", false); // explicit: expense tracking not yet implemented
        return result;
    }

    public Map<String, Object> getRevenueByPeriod(LocalDate startDate, LocalDate endDate) {
        Map<String, Object> report = new HashMap<>();
        report.put("startDate", startDate);
        report.put("endDate", endDate);
        report.put("credits", ledgerEntryRepository.getTotalCreditsBetween(startDate, endDate));
        report.put("debits", ledgerEntryRepository.getTotalDebitsBetween(startDate, endDate));
        report.put("payments", paymentRepository.findByCreatedAtBetween(
                startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay()));
        return report;
    }
}
