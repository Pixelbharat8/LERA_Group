package com.lera.payment_service.scheduler;

import com.lera.payment_service.entity.Invoice;
import com.lera.payment_service.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduled payment-cycle automation.
 *
 * <p>Currently sweeps unpaid invoices whose due date has passed and transitions them
 * from {@code PENDING} to {@code OVERDUE} so downstream reporting, reminders, and late-fee
 * rules have an accurate status to act on. Runs once daily.</p>
 *
 * <p>Enabled by {@code @EnableScheduling} on the application class. The cron expression is
 * configurable via {@code lera.scheduling.overdue-invoices.cron} (defaults to 02:00 daily).</p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class InvoiceScheduler {

    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_OVERDUE = "OVERDUE";

    private final InvoiceRepository invoiceRepository;

    /**
     * Mark pending invoices whose due date is in the past as OVERDUE.
     * Idempotent: only PENDING invoices are considered, so re-runs are no-ops.
     */
    @Scheduled(cron = "${lera.scheduling.overdue-invoices.cron:0 0 2 * * ?}")
    @Transactional
    public void markOverdueInvoices() {
        LocalDate today = LocalDate.now();
        List<Invoice> overdue = invoiceRepository.findByStatusAndDueDateBefore(STATUS_PENDING, today);
        if (overdue.isEmpty()) {
            log.debug("Overdue invoice sweep: nothing to update as of {}", today);
            return;
        }
        for (Invoice invoice : overdue) {
            invoice.setStatus(STATUS_OVERDUE);
        }
        invoiceRepository.saveAll(overdue);
        log.info("Overdue invoice sweep: marked {} invoice(s) OVERDUE as of {}", overdue.size(), today);
    }
}
