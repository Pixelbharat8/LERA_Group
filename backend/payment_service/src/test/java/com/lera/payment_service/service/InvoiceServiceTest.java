package com.lera.payment_service.service;

import com.lera.payment_service.entity.Invoice;
import com.lera.payment_service.entity.Payment;
import com.lera.payment_service.repository.InvoiceRepository;
import com.lera.payment_service.repository.PaymentRepository;
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
}
