package com.lera.payment_service.service;

import com.lera.payment_service.entity.Payment;
import com.lera.payment_service.entity.Refund;
import com.lera.payment_service.repository.PaymentRepository;
import com.lera.payment_service.repository.RefundRepository;
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
class RefundServiceTest {

    @Mock private RefundRepository refundRepository;
    @Mock private PaymentRepository paymentRepository;
    @InjectMocks private RefundService service;

    private static Refund refund(UUID paymentId, String amount, String status) {
        Refund r = new Refund();
        r.setPaymentId(paymentId);
        if (amount != null) r.setAmount(new BigDecimal(amount));
        r.setStatus(status);
        return r;
    }

    private Payment payment(UUID id, String amount) {
        Payment p = new Payment();
        p.setId(id);
        p.setAmount(new BigDecimal(amount));
        when(paymentRepository.findById(id)).thenReturn(Optional.of(p));
        return p;
    }

    @Test
    void createRefund_requiresPaymentId() {
        Refund r = new Refund();
        r.setAmount(new BigDecimal("10"));
        assertThrows(IllegalArgumentException.class, () -> service.createRefund(r));
    }

    @Test
    void createRefund_failsWhenPaymentMissing() {
        UUID pid = UUID.randomUUID();
        when(paymentRepository.findById(pid)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> service.createRefund(refund(pid, "10", "PENDING")));
    }

    @Test
    void createRefund_rejectsNonPositiveAmount() {
        UUID pid = UUID.randomUUID();
        payment(pid, "100");
        assertThrows(IllegalArgumentException.class, () -> service.createRefund(refund(pid, "0", "PENDING")));
        assertThrows(IllegalArgumentException.class, () -> service.createRefund(refund(pid, null, "PENDING")));
    }

    @Test
    void createRefund_rejectsRefundExceedingRefundableBalance() {
        UUID pid = UUID.randomUUID();
        payment(pid, "100");
        // 80 already refunded (COMPLETED) + 30 requested = 110 > 100 paid
        when(refundRepository.findByPaymentId(pid)).thenReturn(List.of(refund(pid, "80", "COMPLETED")));
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.createRefund(refund(pid, "30", "PENDING")));
        assertTrue(ex.getMessage().toLowerCase().contains("refundable balance"));
        verify(refundRepository, never()).save(any());
    }

    @Test
    void createRefund_allowsRefundWithinBalance() {
        UUID pid = UUID.randomUUID();
        payment(pid, "100");
        when(refundRepository.findByPaymentId(pid)).thenReturn(List.of(refund(pid, "80", "COMPLETED")));
        when(refundRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        // 80 + 20 = 100, exactly the payment amount → allowed
        Refund saved = service.createRefund(refund(pid, "20", "PENDING"));
        assertEquals(0, saved.getAmount().compareTo(new BigDecimal("20")));
        verify(refundRepository).save(any());
    }

    @Test
    void createRefund_ignoresCancelledRefundsInTheBalance() {
        UUID pid = UUID.randomUUID();
        payment(pid, "100");
        // A prior CANCELLED refund of 90 must NOT count against the balance.
        when(refundRepository.findByPaymentId(pid)).thenReturn(List.of(refund(pid, "90", "CANCELLED")));
        when(refundRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        assertNotNull(service.createRefund(refund(pid, "50", "PENDING")));
        verify(refundRepository).save(any());
    }
}
