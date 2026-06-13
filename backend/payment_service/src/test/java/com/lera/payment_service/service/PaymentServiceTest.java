package com.lera.payment_service.service;

import com.lera.payment_service.entity.Payment;
import com.lera.payment_service.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private PaymentService paymentService;

    private Payment testPayment;
    private UUID studentId;
    private UUID centerId;

    @BeforeEach
    void setUp() {
        studentId = UUID.randomUUID();
        centerId = UUID.randomUUID();

        testPayment = new Payment();
        testPayment.setId(UUID.randomUUID());
        testPayment.setStudentId(studentId);
        testPayment.setCenterId(centerId);
        testPayment.setAmount(new BigDecimal("5000000"));
        testPayment.setStatus("COMPLETED");
        testPayment.setPaymentMethod("BANK_TRANSFER");
    }

    @Test
    void getAll_shouldReturnAllPayments() {
        when(paymentRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(testPayment));
        assertEquals(1, paymentService.getAll().size());
    }

    @Test
    void getById_shouldReturnPayment() {
        when(paymentRepository.findById(testPayment.getId())).thenReturn(Optional.of(testPayment));
        assertTrue(paymentService.getById(testPayment.getId()).isPresent());
    }

    @Test
    void getById_shouldReturnEmptyWhenNotFound() {
        UUID randomId = UUID.randomUUID();
        when(paymentRepository.findById(randomId)).thenReturn(Optional.empty());
        assertTrue(paymentService.getById(randomId).isEmpty());
    }

    @Test
    void getByStudent_shouldReturnPayments() {
        when(paymentRepository.findByStudentId(studentId)).thenReturn(List.of(testPayment));
        List<Payment> result = paymentService.getByStudent(studentId);
        assertEquals(1, result.size());
        assertEquals(studentId, result.get(0).getStudentId());
    }

    @Test
    void getByCenter_shouldReturnPayments() {
        when(paymentRepository.findByCenterId(centerId)).thenReturn(List.of(testPayment));
        List<Payment> result = paymentService.getByCenter(centerId);
        assertEquals(1, result.size());
    }

    @Test
    void getFiltered_byCenterId() {
        when(paymentRepository.findByCenterId(centerId)).thenReturn(List.of(testPayment));
        List<Payment> result = paymentService.getFiltered(centerId, null, null, null);
        assertEquals(1, result.size());
    }

    @Test
    void getFiltered_noFilters() {
        when(paymentRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(testPayment));
        List<Payment> result = paymentService.getFiltered(null, null, null, null);
        assertEquals(1, result.size());
    }

    @Test
    void getSummary_orgWide_usesDbAggregatesNotFullScan() {
        when(paymentRepository.countByStatus("COMPLETED")).thenReturn(1L);
        when(paymentRepository.countByStatus("PENDING")).thenReturn(1L);
        when(paymentRepository.getTotalRevenue()).thenReturn(new BigDecimal("5000000"));
        when(paymentRepository.sumAmountByStatus("PENDING")).thenReturn(new BigDecimal("2000000"));
        when(paymentRepository.count()).thenReturn(2L);

        Map<String, Object> summary = paymentService.getSummary(null);

        assertEquals(new BigDecimal("5000000"), summary.get("totalRevenue"));
        assertEquals(new BigDecimal("2000000"), summary.get("pendingAmount"));
        assertEquals(1L, summary.get("completedCount"));
        assertEquals(1L, summary.get("pendingCount"));
        assertEquals(2, summary.get("totalCount"));
        // The org-wide summary must never materialize the whole payments table.
        verify(paymentRepository, never()).findAll();
    }

    @Test
    void getSummary_centreScoped_aggregatesBoundedList() {
        Payment pendingPayment = new Payment();
        pendingPayment.setStatus("PENDING");
        pendingPayment.setAmount(new BigDecimal("2000000"));
        when(paymentRepository.findByCenterId(centerId)).thenReturn(List.of(testPayment, pendingPayment));

        Map<String, Object> summary = paymentService.getSummary(centerId);

        assertEquals(new BigDecimal("5000000"), summary.get("totalRevenue"));
        assertEquals(new BigDecimal("2000000"), summary.get("pendingAmount"));
        assertEquals(1L, summary.get("completedCount"));
        assertEquals(1L, summary.get("pendingCount"));
        assertEquals(2, summary.get("totalCount"));
    }

    @Test
    void create_shouldSavePayment() {
        when(paymentRepository.save(any(Payment.class))).thenReturn(testPayment);
        Payment result = paymentService.create(testPayment);
        assertNotNull(result);
        verify(paymentRepository).save(testPayment);
    }

    @Test
    void createBulk_shouldSaveAll() {
        when(paymentRepository.saveAll(any())).thenReturn(List.of(testPayment));
        List<Payment> result = paymentService.createBulk(List.of(testPayment));
        assertEquals(1, result.size());
    }

    @Test
    void updateStatus_shouldSetPaidAtForCompleted() {
        testPayment.setStatus("PENDING");
        when(paymentRepository.findById(testPayment.getId())).thenReturn(Optional.of(testPayment));
        when(paymentRepository.save(any(Payment.class))).thenReturn(testPayment);

        Optional<Payment> result = paymentService.updateStatus(testPayment.getId(), "COMPLETED");
        assertTrue(result.isPresent());
        assertEquals("COMPLETED", testPayment.getStatus());
        assertNotNull(testPayment.getPaidAt());
    }

    @Test
    void delete_shouldReturnTrueWhenExists() {
        when(paymentRepository.findById(testPayment.getId())).thenReturn(Optional.of(testPayment));
        assertTrue(paymentService.delete(testPayment.getId()));
        verify(paymentRepository).delete(testPayment);
    }

    @Test
    void delete_shouldReturnFalseWhenNotExists() {
        UUID randomId = UUID.randomUUID();
        when(paymentRepository.findById(randomId)).thenReturn(Optional.empty());
        assertFalse(paymentService.delete(randomId));
    }
}
