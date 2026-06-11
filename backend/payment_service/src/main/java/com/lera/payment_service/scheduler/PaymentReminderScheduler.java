package com.lera.payment_service.scheduler;

import com.lera.payment_service.client.NotificationClient;
import com.lera.payment_service.entity.Invoice;
import com.lera.payment_service.repository.InvoiceRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Sends payment reminders for unpaid invoices that are overdue or due soon. Reuses the existing
 * notification path ({@link NotificationClient#notifyPaymentDue}) and the shared-DB parent lookup.
 * Idempotent per day via {@code invoices.last_reminder_at}.
 */
@Component
@Slf4j
public class PaymentReminderScheduler {

    private final InvoiceRepository invoiceRepository;
    private final JdbcTemplate jdbcTemplate;
    private final NotificationClient notificationClient;

    @Value("${lera.scheduling.payment-reminders.days-ahead:3}")
    private int daysAhead;

    public PaymentReminderScheduler(InvoiceRepository invoiceRepository, JdbcTemplate jdbcTemplate,
                                    NotificationClient notificationClient) {
        this.invoiceRepository = invoiceRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.notificationClient = notificationClient;
    }

    /** Daily after the overdue sweep. */
    @Scheduled(cron = "${lera.scheduling.payment-reminders.cron:0 30 2 * * ?}")
    public void scheduledRun() {
        int sent = runReminders();
        log.info("Payment reminder run: {} reminder(s) sent", sent);
    }

    @Transactional
    public int runReminders() {
        LocalDate today = LocalDate.now();
        LocalDate cutoff = today.plusDays(Math.max(0, daysAhead));
        List<Invoice> due = invoiceRepository.findRemindable(cutoff, today.atStartOfDay());
        int sent = 0;
        for (Invoice inv : due) {
            if (sendReminder(inv, today)) {
                inv.setLastReminderAt(LocalDateTime.now());
                invoiceRepository.save(inv);
                sent++;
            }
        }
        return sent;
    }

    private boolean sendReminder(Invoice inv, LocalDate today) {
        if (inv.getStudentId() == null) return false;
        try {
            Map<String, Object> row = jdbcTemplate.queryForMap(
                    "SELECT s.parent_id, s.fullname FROM students s WHERE s.id = ?", inv.getStudentId());
            Object pid = row.get("parent_id");
            if (pid == null) return false;
            UUID parentId = pid instanceof UUID u ? u : UUID.fromString(pid.toString());
            String name = row.get("fullname") != null ? row.get("fullname").toString() : "Student";
            double amount = inv.getTotalAmount() != null ? inv.getTotalAmount().doubleValue() : 0d;
            int daysOverdue = inv.getDueDate() != null
                    ? (int) ChronoUnit.DAYS.between(inv.getDueDate(), today) : 0;
            notificationClient.notifyPaymentDue(parentId, name, amount, inv.getCurrency(), daysOverdue);
            return true;
        } catch (EmptyResultDataAccessException e) {
            return false; // student row missing
        } catch (Exception e) {
            log.warn("Payment reminder failed for invoice {}: {}", inv.getId(), e.getMessage());
            return false;
        }
    }
}
