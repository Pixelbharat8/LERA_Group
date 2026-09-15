package com.lera.payment_service.service;

import com.lera.payment_service.entity.Invoice;
import com.lera.payment_service.entity.Payment;
import com.lera.payment_service.repository.InvoiceRepository;
import com.lera.payment_service.repository.PaymentRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private InvoiceServiceImpl invoiceService;

    private Invoice pendingInvoice(BigDecimal total) {
        Invoice inv = new Invoice();
        inv.setId(UUID.randomUUID());
        inv.setStatus("PENDING");
        inv.setTotalAmount(total);
        return inv;
    }

    private Payment settled(String amount) {
        Payment p = new Payment();
        p.setStatus("COMPLETED");
        p.setAmount(new BigDecimal(amount));
        return p;
    }

    @Test
    void findById_found() {
        UUID id = UUID.randomUUID();
        Invoice inv = new Invoice();
        inv.setId(id);
        when(invoiceRepository.findById(id)).thenReturn(Optional.of(inv));
        Optional<Invoice> result = invoiceService.getInvoiceById(id);
        assertTrue(result.isPresent());
        assertEquals(id, result.get().getId());
    }

    @Test
    void findById_notFound() {
        when(invoiceRepository.findById(any())).thenReturn(Optional.empty());
        assertTrue(invoiceService.getInvoiceById(UUID.randomUUID()).isEmpty());
    }

    @Test
    void create_persists() {
        Invoice inv = new Invoice();
        when(invoiceRepository.save(any())).thenReturn(inv);
        assertNotNull(invoiceService.createInvoice(inv));
    }

    @Test
    void delete_exists() {
        UUID id = UUID.randomUUID();
        when(invoiceRepository.existsById(id)).thenReturn(true);
        assertTrue(invoiceService.deleteInvoice(id));
        verify(invoiceRepository).deleteById(id);
    }

    @Test
    void delete_notExists() {
        when(invoiceRepository.existsById(any())).thenReturn(false);
        assertFalse(invoiceService.deleteInvoice(UUID.randomUUID()));
    }

    // --- financial-integrity invariant: an invoice can't be marked PAID without the money settled ---

    @Test
    void markPaid_rejectedWhenNoPayments() {
        Invoice inv = pendingInvoice(new BigDecimal("1000000"));
        when(invoiceRepository.findById(inv.getId())).thenReturn(Optional.of(inv));
        when(paymentRepository.findByInvoiceId(inv.getId())).thenReturn(List.of());

        assertThrows(IllegalArgumentException.class,
                () -> invoiceService.updateInvoiceStatus(inv.getId(), "PAID"));
        verify(invoiceRepository, never()).save(any());
    }

    @Test
    void markPaid_rejectedWhenPaymentsPartial() {
        Invoice inv = pendingInvoice(new BigDecimal("1000000"));
        when(invoiceRepository.findById(inv.getId())).thenReturn(Optional.of(inv));
        when(paymentRepository.findByInvoiceId(inv.getId())).thenReturn(List.of(settled("400000")));

        assertThrows(IllegalArgumentException.class,
                () -> invoiceService.updateInvoiceStatus(inv.getId(), "PAID"));
        verify(invoiceRepository, never()).save(any());
    }

    @Test
    void markPaid_succeedsWhenSettledCoversTotal() {
        Invoice inv = pendingInvoice(new BigDecimal("1000000"));
        inv.setStudentId(null); // skip the parent-notification path (not under test here)
        when(invoiceRepository.findById(inv.getId())).thenReturn(Optional.of(inv));
        when(paymentRepository.findByInvoiceId(inv.getId()))
                .thenReturn(List.of(settled("400000"), settled("600000"))); // 1,000,000 settled
        when(invoiceRepository.save(any())).thenAnswer(a -> a.getArgument(0));

        Optional<Invoice> result = invoiceService.updateInvoiceStatus(inv.getId(), "PAID");
        assertTrue(result.isPresent());
        assertEquals("PAID", result.get().getStatus());
        assertNotNull(result.get().getPaidAt());
    }

    @Test
    void markPaid_zeroTotalNeedsNoPayment() {
        Invoice inv = pendingInvoice(BigDecimal.ZERO); // no-charge invoice
        inv.setStudentId(null);
        when(invoiceRepository.findById(inv.getId())).thenReturn(Optional.of(inv));
        when(invoiceRepository.save(any())).thenAnswer(a -> a.getArgument(0));

        Optional<Invoice> result = invoiceService.updateInvoiceStatus(inv.getId(), "PAID");
        assertTrue(result.isPresent());
        assertEquals("PAID", result.get().getStatus());
    }

    // ---- invoice total must agree with its own parts -------------------------------------------
    // Nothing checked this. Posting subtotal 5,000,000 with discount 500,000, tax 250,000 and a
    // totalAmount of 1 stored a total of 1 — and the PAID guard then accepts payments covering 1
    // as settling the invoice. These pin the arithmetic so it cannot drift back.

    private Invoice parts(BigDecimal subtotal, BigDecimal discount, BigDecimal tax, BigDecimal total) {
        Invoice inv = new Invoice();
        inv.setInvoiceNumber("INV-TEST");
        inv.setSubtotal(subtotal);
        inv.setDiscountAmount(discount);
        inv.setTaxAmount(tax);
        inv.setTotalAmount(total);
        return inv;
    }

    @Test
    void createInvoice_rejectsATotalThatContradictsItsParts() {
        Invoice inv = parts(new BigDecimal("5000000"), new BigDecimal("500000"),
                new BigDecimal("250000"), BigDecimal.ONE);

        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> invoiceService.createInvoice(inv));
        assertTrue(e.getMessage().contains("4750000"), "should name the correct total: " + e.getMessage());
        verify(invoiceRepository, never()).save(any());
    }

    @Test
    void createInvoice_computesTheTotalWhenItIsMissing() {
        Invoice inv = parts(new BigDecimal("5000000"), new BigDecimal("500000"),
                new BigDecimal("250000"), null);
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(a -> a.getArgument(0));

        Invoice saved = invoiceService.createInvoice(inv);
        assertEquals(0, new BigDecimal("4750000").compareTo(saved.getTotalAmount()));
    }

    @Test
    void createInvoice_acceptsACorrectTotal() {
        Invoice inv = parts(new BigDecimal("5000000"), new BigDecimal("500000"),
                new BigDecimal("250000"), new BigDecimal("4750000"));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(a -> a.getArgument(0));

        assertEquals(0, new BigDecimal("4750000").compareTo(
                invoiceService.createInvoice(inv).getTotalAmount()));
    }

    @Test
    void updateInvoice_recomputesTheTotalWhenAComponentChanges() {
        // The create guard is worthless if an update can walk the total away from its parts.
        Invoice existing = parts(new BigDecimal("5000000"), BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("5000000"));
        existing.setId(UUID.randomUUID());
        when(invoiceRepository.findById(existing.getId())).thenReturn(Optional.of(existing));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(a -> a.getArgument(0));

        Invoice change = new Invoice();
        change.setDiscountAmount(new BigDecimal("1000000"));   // total not restated

        Invoice updated = invoiceService.updateInvoice(existing.getId(), change).orElseThrow();
        assertEquals(0, new BigDecimal("4000000").compareTo(updated.getTotalAmount()));
    }

    @Test
    void updateInvoice_leavesANonMoneyUpdateAlone() {
        // The record-payment flow sends only paidAt/status; it must not trip the guard.
        Invoice existing = parts(new BigDecimal("5000000"), BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("5000000"));
        existing.setId(UUID.randomUUID());
        existing.setStatus("PENDING");
        when(invoiceRepository.findById(existing.getId())).thenReturn(Optional.of(existing));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(a -> a.getArgument(0));

        Invoice change = new Invoice();
        change.setNotes("payment recorded");

        Invoice updated = invoiceService.updateInvoice(existing.getId(), change).orElseThrow();
        assertEquals(0, new BigDecimal("5000000").compareTo(updated.getTotalAmount()));
        assertEquals("payment recorded", updated.getNotes());
    }

    // ---- paid amount / balance, resolved from the payment rows ----

    /**
     * Stand in for the "SUM(amount) GROUP BY invoice_id" query: hand the service one row saying
     * this invoice has `paid` settled against it.
     */
    private void stubSettled(UUID invoiceId, String paid) {
        doAnswer(inv -> {
            RowCallbackHandler handler = inv.getArgument(1);
            java.sql.ResultSet rs = mock(java.sql.ResultSet.class);
            when(rs.getObject("invoice_id", UUID.class)).thenReturn(invoiceId);
            when(rs.getBigDecimal("paid")).thenReturn(new BigDecimal(paid));
            handler.processRow(rs);
            return null;
        }).when(jdbcTemplate).query(anyString(), any(RowCallbackHandler.class), any(Object[].class));
    }

    @Test
    void partPaidInvoice_reportsWhatWasPaidAndWhatIsLeft() {
        Invoice inv = pendingInvoice(new BigDecimal("5000000"));
        when(invoiceRepository.findById(inv.getId())).thenReturn(Optional.of(inv));
        stubSettled(inv.getId(), "2000000");

        Invoice found = invoiceService.getInvoiceById(inv.getId()).orElseThrow();

        assertEquals(0, new BigDecimal("2000000").compareTo(found.getPaidAmount()),
                "paid amount must come from the settled payments, not a column that does not exist");
        assertEquals(0, new BigDecimal("3000000").compareTo(found.getBalance()),
                "balance showed the FULL total on a part-paid invoice while paidAmount read 0");
    }

    @Test
    void invoiceWithNoPayments_reportsZeroPaid_notNull() {
        Invoice inv = pendingInvoice(new BigDecimal("5000000"));
        when(invoiceRepository.findById(inv.getId())).thenReturn(Optional.of(inv));
        doNothing().when(jdbcTemplate).query(anyString(), any(RowCallbackHandler.class), any(Object[].class));

        Invoice found = invoiceService.getInvoiceById(inv.getId()).orElseThrow();

        assertEquals(0, BigDecimal.ZERO.compareTo(found.getPaidAmount()));
        assertEquals(0, new BigDecimal("5000000").compareTo(found.getBalance()));
    }

    @Test
    void overpaidInvoice_reportsZeroBalance_notANegativeOne() {
        Invoice inv = pendingInvoice(new BigDecimal("5000000"));
        when(invoiceRepository.findById(inv.getId())).thenReturn(Optional.of(inv));
        stubSettled(inv.getId(), "6000000");

        Invoice found = invoiceService.getInvoiceById(inv.getId()).orElseThrow();

        assertEquals(0, BigDecimal.ZERO.compareTo(found.getBalance()),
                "a balance owing cannot be negative");
    }

    /**
     * The case that could never complete: two instalments against one invoice. The page computes
     * the new paid total as `paidAmount + amount`, so with paidAmount always reading 0 the second
     * instalment recomputed to just itself and the invoice stayed PARTIAL however much had been
     * received.
     */
    @Test
    void secondInstalment_addsToTheFirst_soTheInvoiceCanReachPaid() {
        Invoice inv = pendingInvoice(new BigDecimal("5000000"));
        when(invoiceRepository.findById(inv.getId())).thenReturn(Optional.of(inv));
        stubSettled(inv.getId(), "2500000");

        Invoice afterFirst = invoiceService.getInvoiceById(inv.getId()).orElseThrow();
        BigDecimal secondInstalment = new BigDecimal("2500000");
        BigDecimal newPaidTotal = afterFirst.getPaidAmount().add(secondInstalment);

        assertTrue(newPaidTotal.compareTo(inv.getTotalAmount()) >= 0,
                "2,500,000 already paid plus another 2,500,000 covers a 5,000,000 invoice");
    }
}