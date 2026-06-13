package com.lera.payroll_service.service;

import com.lera.payroll_service.entity.PayrollRecord;
import com.lera.payroll_service.repository.PayrollRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PayrollServiceTest {

    @Mock
    private PayrollRepository payrollRepository;

    @InjectMocks
    private PayrollService payrollService;

    private PayrollRecord testRecord;
    private UUID teacherId;

    @BeforeEach
    void setUp() {
        teacherId = UUID.randomUUID();
        testRecord = new PayrollRecord();
        testRecord.setId(UUID.randomUUID());
        testRecord.setTeacherId(teacherId);
        testRecord.setStatus("PENDING");
        testRecord.setBaseSalary(new BigDecimal("5000000"));
        testRecord.setPayPeriodStart(LocalDate.of(2024, 1, 1));
    }

    @Test
    void getAll_shouldReturnAllRecords() {
        when(payrollRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(testRecord));

        List<PayrollRecord> result = payrollService.getAll();
        assertEquals(1, result.size());
    }

    @Test
    void getById_shouldReturnRecord() {
        when(payrollRepository.findById(testRecord.getId())).thenReturn(Optional.of(testRecord));

        Optional<PayrollRecord> result = payrollService.getById(testRecord.getId());
        assertTrue(result.isPresent());
        assertEquals("PENDING", result.get().getStatus());
    }

    @Test
    void getByTeacher_shouldReturnRecords() {
        when(payrollRepository.findByTeacherIdOrderByPayPeriodStartDesc(teacherId))
                .thenReturn(List.of(testRecord));

        List<PayrollRecord> result = payrollService.getByTeacher(teacherId);
        assertEquals(1, result.size());
        assertEquals(teacherId, result.get(0).getTeacherId());
    }

    @Test
    void getByTeacherAndYear_shouldFilterByYear() {
        PayrollRecord record2023 = new PayrollRecord();
        record2023.setId(UUID.randomUUID());
        record2023.setTeacherId(teacherId);
        record2023.setPayPeriodStart(LocalDate.of(2023, 6, 1));

        when(payrollRepository.findByTeacherIdOrderByPayPeriodStartDesc(teacherId))
                .thenReturn(List.of(testRecord, record2023));

        List<PayrollRecord> result = payrollService.getByTeacherAndYear(teacherId, 2024);
        assertEquals(1, result.size());
        assertEquals(2024, result.get(0).getPayPeriodStart().getYear());
    }

    @Test
    void getByStatus_shouldReturnFilteredRecords() {
        when(payrollRepository.findByStatusOrderByCreatedAtDesc("PENDING"))
                .thenReturn(List.of(testRecord));

        List<PayrollRecord> result = payrollService.getByStatus("PENDING");
        assertEquals(1, result.size());
    }

    @Test
    void getStats_shouldReturnStatistics() {
        when(payrollRepository.getTotalPayroll()).thenReturn(new BigDecimal("50000000"));
        when(payrollRepository.countByStatus("PENDING")).thenReturn(5L);
        when(payrollRepository.countByStatus("APPROVED")).thenReturn(3L);
        when(payrollRepository.countByStatus("PAID")).thenReturn(10L);

        Map<String, Object> stats = payrollService.getStats();
        assertEquals(new BigDecimal("50000000"), stats.get("totalPayroll"));
        assertEquals(5L, stats.get("pendingCount"));
        assertEquals(3L, stats.get("approvedCount"));
        assertEquals(10L, stats.get("paidCount"));
    }

    @Test
    void create_shouldSaveRecord() {
        when(payrollRepository.save(any(PayrollRecord.class))).thenReturn(testRecord);

        PayrollRecord result = payrollService.create(testRecord);
        assertNotNull(result);
        verify(payrollRepository).save(testRecord);
    }

    @Test
    void approve_shouldUpdateStatusToApproved() {
        UUID approvedBy = UUID.randomUUID();
        when(payrollRepository.findById(testRecord.getId())).thenReturn(Optional.of(testRecord));
        when(payrollRepository.save(any(PayrollRecord.class))).thenReturn(testRecord);

        Optional<PayrollRecord> result = payrollService.approve(testRecord.getId(), approvedBy);
        assertTrue(result.isPresent());
        assertEquals("APPROVED", testRecord.getStatus());
        assertEquals(approvedBy, testRecord.getApprovedBy());
    }

    @Test
    void updateStatus_shouldChangeStatus() {
        when(payrollRepository.findById(testRecord.getId())).thenReturn(Optional.of(testRecord));
        when(payrollRepository.save(any(PayrollRecord.class))).thenReturn(testRecord);

        Optional<PayrollRecord> result = payrollService.updateStatus(testRecord.getId(), "PAID");
        assertTrue(result.isPresent());
        assertEquals("PAID", testRecord.getStatus());
    }

    @Test
    void delete_shouldReturnTrueWhenExists() {
        when(payrollRepository.existsById(testRecord.getId())).thenReturn(true);

        assertTrue(payrollService.delete(testRecord.getId()));
        verify(payrollRepository).deleteById(testRecord.getId());
    }

    @Test
    void delete_shouldReturnFalseWhenNotExists() {
        UUID randomId = UUID.randomUUID();
        when(payrollRepository.existsById(randomId)).thenReturn(false);

        assertFalse(payrollService.delete(randomId));
        verify(payrollRepository, never()).deleteById(any());
    }
}
