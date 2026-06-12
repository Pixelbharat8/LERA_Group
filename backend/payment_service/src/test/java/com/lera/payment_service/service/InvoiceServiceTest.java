package com.lera.payment_service.service;

import com.lera.payment_service.entity.Invoice;
import com.lera.payment_service.repository.InvoiceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @InjectMocks
    private InvoiceServiceImpl invoiceService;

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
}
