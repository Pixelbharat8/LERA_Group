package com.lera.payment_service.scheduler;

import com.lera.payment_service.client.NotificationClient;
import com.lera.payment_service.entity.Invoice;
import com.lera.payment_service.repository.InvoiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentReminderSchedulerTest {

    @Mock private InvoiceRepository invoiceRepository;
    @Mock private JdbcTemplate jdbcTemplate;
    @Mock private NotificationClient notificationClient;

    private PaymentReminderScheduler scheduler;

    private final UUID studentId = UUID.randomUUID();
    private final UUID parentId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        scheduler = new PaymentReminderScheduler(invoiceRepository, jdbcTemplate, notificationClient);
    }

    private Invoice overdueInvoice() {
        Invoice inv = new Invoice();
        inv.setStudentId(studentId);
        inv.setTotalAmount(new BigDecimal("1500000"));
        inv.setCurrency("VND");
        inv.setStatus("OVERDUE");
        inv.setDueDate(LocalDate.now().minusDays(5));
        return inv;
    }

    @Test
    void remindableInvoice_sendsNotification_andStampsLastReminder() {
        Invoice inv = overdueInvoice();
        when(invoiceRepository.findRemindable(any(), any())).thenReturn(List.of(inv));
        when(jdbcTemplate.queryForMap(anyString(), any()))
                .thenReturn(Map.of("parent_id", parentId, "fullname", "Test Student"));

        int sent = scheduler.runReminders();

        assertEquals(1, sent);
        verify(notificationClient).notifyPaymentDue(eq(parentId), eq("Test Student"), anyDouble(), eq("VND"), anyInt());
        assertNotNull(inv.getLastReminderAt(), "last_reminder_at should be stamped");
        verify(invoiceRepository).save(inv);
    }

    @Test
    void studentWithoutParent_isSkipped() {
        Invoice inv = overdueInvoice();
        when(invoiceRepository.findRemindable(any(), any())).thenReturn(List.of(inv));
        when(jdbcTemplate.queryForMap(anyString(), any()))
                .thenReturn(java.util.Collections.singletonMap("parent_id", null)); // no parent linked

        int sent = scheduler.runReminders();

        assertEquals(0, sent);
        verifyNoInteractions(notificationClient);
        verify(invoiceRepository, never()).save(any());
        assertNull(inv.getLastReminderAt());
    }

    @Test
    void nothingRemindable_returnsZero() {
        when(invoiceRepository.findRemindable(any(), any())).thenReturn(List.of());
        assertEquals(0, scheduler.runReminders());
        verifyNoInteractions(notificationClient);
    }
}
