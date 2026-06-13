package com.lera.attendance_service.service;

import com.lera.attendance_service.repository.TeacherSessionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeacherSessionServiceTest {

    @Mock private TeacherSessionRepository teacherSessionRepository;
    @InjectMocks private TeacherSessionService service;

    @Test
    void totalHours_returnsRepositorySum() {
        when(teacherSessionRepository.getTotalHoursForPeriod(any(), any(), any()))
                .thenReturn(new BigDecimal("12.5"));
        BigDecimal hours = service.getTotalHoursForPeriod(
                UUID.randomUUID(), LocalDate.now().minusDays(30), LocalDate.now());
        assertEquals(0, hours.compareTo(new BigDecimal("12.5")));
    }

    @Test
    void totalHours_coalescesNullSumToZero() {
        // No sessions in the period → SUM is null. Payroll multiplies this by the hourly
        // rate, so it must be ZERO, never null.
        when(teacherSessionRepository.getTotalHoursForPeriod(any(), any(), any())).thenReturn(null);
        BigDecimal hours = service.getTotalHoursForPeriod(
                UUID.randomUUID(), LocalDate.now().minusDays(30), LocalDate.now());
        assertEquals(0, hours.compareTo(BigDecimal.ZERO));
    }
}
