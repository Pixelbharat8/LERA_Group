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

    public Map<String, Object> getDashboardSummary(UUID centerId) {
        Map<String, Object> summary = new HashMap<>();
        
        BigDecimal totalRevenue = paymentRepository.getTotalRevenue();
        summary.put("totalRevenue", totalRevenue != null ? totalRevenue : BigDecimal.ZERO);
        summary.put("pendingPayments", paymentRepository.countByStatus("PENDING"));
        summary.put("completedPayments", paymentRepository.countByStatus("COMPLETED"));
        summary.put("failedPayments", paymentRepository.countByStatus("FAILED"));
        summary.put("totalInvoices", invoiceRepository.count());

        List<Invoice> allInvoices = invoiceRepository.findAll();
        long paidInvoices = allInvoices.stream().filter(i -> "PAID".equalsIgnoreCase(i.getStatus())).count();
        long pendingInvoices = allInvoices.stream().filter(i -> "PENDING".equalsIgnoreCase(i.getStatus())).count();
        long overdueInvoices = allInvoices.stream().filter(i -> "OVERDUE".equalsIgnoreCase(i.getStatus())).count();
        long cancelledInvoices = allInvoices.stream().filter(i -> "CANCELLED".equalsIgnoreCase(i.getStatus())).count();

        Map<String, Long> invoiceStats = new HashMap<>();
        invoiceStats.put("total", (long) allInvoices.size());
        invoiceStats.put("paid", paidInvoices);
        invoiceStats.put("pending", pendingInvoices);
        invoiceStats.put("overdue", overdueInvoices);
        invoiceStats.put("cancelled", cancelledInvoices);
        summary.put("invoiceStats", invoiceStats);

        BigDecimal outstandingAmount = allInvoices.stream()
                .filter(i -> "PENDING".equalsIgnoreCase(i.getStatus()) || "OVERDUE".equalsIgnoreCase(i.getStatus()))
                .map(i -> i.getTotalAmount() != null ? i.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        summary.put("outstandingAmount", outstandingAmount);

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
        List<Invoice> paidInvoices = invoiceRepository.findByStatus("PAID");
        Map<UUID, List<Invoice>> grouped = paidInvoices.stream()
                .filter(i -> i.getCenterId() != null)
                .collect(Collectors.groupingBy(Invoice::getCenterId));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<UUID, List<Invoice>> entry : grouped.entrySet()) {
            BigDecimal revenue = entry.getValue().stream()
                    .map(i -> i.getTotalAmount() != null ? i.getTotalAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            result.add(Map.of(
                    "centerId", entry.getKey().toString(),
                    "centerName", "Center " + entry.getKey().toString().substring(0, 8),
                    "totalRevenue", revenue,
                    "invoiceCount", entry.getValue().size()));
        }
        return result;
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
