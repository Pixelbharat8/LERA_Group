package com.lera.payment_service.service;

import com.lera.payment_service.client.NotificationClient;
import com.lera.payment_service.entity.Invoice;
import com.lera.payment_service.entity.Payment;
import com.lera.payment_service.repository.InvoiceRepository;
import com.lera.payment_service.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class InvoiceServiceImpl {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final JdbcTemplate jdbcTemplate;
    private final NotificationClient notificationClient;
    private final InvoicePaidMailService invoicePaidMailService;

    /** Payment statuses that count as money actually received against an invoice. */
    private static final List<String> SETTLED_PAYMENT_STATUSES =
            List.of("COMPLETED", "SUCCESS", "PAID", "SETTLED");

    public Page<Invoice> getAllInvoices(Pageable pageable) {
        return invoiceRepository.findAll(pageable);
    }

    public Optional<Invoice> getInvoiceById(UUID id) {
        return invoiceRepository.findById(id);
    }

    public Optional<Invoice> getInvoiceByNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber);
    }

    public List<Invoice> getInvoicesByStudent(UUID studentId) {
        return invoiceRepository.findByStudentId(studentId);
    }

    public List<Invoice> getInvoicesByCenter(UUID centerId) {
        return invoiceRepository.findByCenterId(centerId);
    }

    public List<Invoice> getInvoicesByStatus(String status) {
        return invoiceRepository.findByStatus(status);
    }

    /**
     * Invoices for all children linked to a parent (via the student_parents link table).
     */
    public List<Invoice> getInvoicesForParent(UUID parentId) {
        return invoiceRepository.findByParentIdJoinStudents(parentId);
    }

    @Transactional
    public Invoice createInvoice(Invoice invoice) {
        if (invoice.getInvoiceNumber() == null || invoice.getInvoiceNumber().isEmpty()) {
            invoice.setInvoiceNumber("INV-" + System.currentTimeMillis());
        }
        log.info("Creating invoice: {} for student: {}", invoice.getInvoiceNumber(), invoice.getStudentId());
        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Optional<Invoice> updateInvoice(UUID id, Invoice details) {
        return invoiceRepository.findById(id).map(existing -> {
            details.setId(id);
            return invoiceRepository.save(details);
        });
    }

    @Transactional
    public Optional<Invoice> updateInvoiceStatus(UUID id, String status) {
        return invoiceRepository.findById(id).map(invoice -> {
            String previous = invoice.getStatus();
            if ("PAID".equalsIgnoreCase(status) && !"PAID".equalsIgnoreCase(previous)) {
                assertSufficientPayments(invoice);
            }
            invoice.setStatus(status);
            if ("PAID".equalsIgnoreCase(status)) {
                invoice.setPaidAt(LocalDateTime.now());
            }
            Invoice saved = invoiceRepository.save(invoice);
            if ("PAID".equalsIgnoreCase(status)
                    && (previous == null || !"PAID".equalsIgnoreCase(previous))
                    && saved.getStudentId() != null) {
                notifyParentInvoicePaid(saved);
            }
            return saved;
        });
    }

    /**
     * Guard the transition to PAID: the settled payments recorded against this invoice must
     * cover its total. Prevents marking an invoice PAID without money actually received.
     */
    private void assertSufficientPayments(Invoice invoice) {
        BigDecimal total = invoice.getTotalAmount() != null ? invoice.getTotalAmount() : BigDecimal.ZERO;
        if (total.signum() <= 0) {
            return; // zero/no-charge invoice — nothing to collect
        }
        BigDecimal settled = paymentRepository.findByInvoiceId(invoice.getId()).stream()
                .filter(p -> p.getStatus() == null
                        || SETTLED_PAYMENT_STATUSES.contains(p.getStatus().toUpperCase()))
                .map(Payment::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (settled.compareTo(total) < 0) {
            throw new IllegalArgumentException(
                    "Cannot mark invoice PAID: recorded payments " + settled + " are less than the total " + total);
        }
    }

    private void notifyParentInvoicePaid(Invoice invoice) {
        try {
            var row = jdbcTemplate.queryForMap(
                    "SELECT pp.parent_id, s.fullname, u.email AS parent_email "
                            + "FROM students s "
                            + "LEFT JOIN LATERAL (SELECT sp.parent_id FROM student_parents sp "
                            + "  WHERE sp.student_id = s.id ORDER BY sp.is_primary DESC NULLS LAST LIMIT 1) pp ON true "
                            + "LEFT JOIN users u ON u.id = pp.parent_id "
                            + "WHERE s.id = ?",
                    invoice.getStudentId());
            Object pid = row.get("parent_id");
            if (pid == null) {
                log.debug("No parent_id for student {} — skipping payment-received notification", invoice.getStudentId());
                return;
            }
            UUID parentId = pid instanceof UUID u ? u : UUID.fromString(pid.toString());
            String studentName = row.get("fullname") != null ? row.get("fullname").toString() : "Student";
            double amount = invoice.getTotalAmount() != null ? invoice.getTotalAmount().doubleValue() : 0d;
            String currency = invoice.getCurrency() != null ? invoice.getCurrency() : "VND";
            notificationClient.notifyPaymentReceived(parentId, studentName, amount, currency, invoice.getId());

            Object emailObj = row.get("parent_email");
            String parentEmail = emailObj != null ? emailObj.toString().trim() : "";
            if (!parentEmail.isEmpty()) {
                String amtStr = invoice.getTotalAmount() != null ? invoice.getTotalAmount().toPlainString() : "0";
                boolean mailed = invoicePaidMailService.sendPaymentReceipt(
                        parentEmail,
                        studentName,
                        invoice.getInvoiceNumber(),
                        amtStr,
                        currency);
                if (mailed) {
                    log.info("Payment receipt email sent for invoice {}", invoice.getInvoiceNumber());
                }
            }
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            log.warn("Student {} not found for invoice {} — cannot notify parent", invoice.getStudentId(), invoice.getId());
        } catch (Exception e) {
            log.error("Failed to resolve parent for payment notification: {}", e.getMessage());
        }
    }

    @Transactional
    public boolean deleteInvoice(UUID id) {
        if (invoiceRepository.existsById(id)) {
            invoiceRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
