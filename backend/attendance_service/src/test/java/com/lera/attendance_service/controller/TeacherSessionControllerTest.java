package com.lera.attendance_service.controller;

import com.lera.attendance_service.entity.TeacherSession;
import com.lera.attendance_service.service.TeacherSessionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Direct controller call (no servlet stack) — validates the /teacher/{id}/hours response
 * contract that payroll_service.PayrollGenerationService consumes (the "totalHours" key).
 */
@ExtendWith(MockitoExtension.class)
class TeacherSessionControllerTest {

    @Mock private TeacherSessionService teacherSessionService;
    @InjectMocks private TeacherSessionController controller;

    @Test
    void getTeacherHours_returnsTotalHoursAndSessionCount() {
        UUID teacherId = UUID.randomUUID();
        LocalDate start = LocalDate.of(2026, 6, 1);
        LocalDate end = LocalDate.of(2026, 6, 30);
        when(teacherSessionService.getTotalHoursForPeriod(teacherId, start, end))
                .thenReturn(new BigDecimal("8.0"));
        when(teacherSessionService.getSessionsByTeacherAndDateRange(teacherId, start, end))
                .thenReturn(List.of(new TeacherSession(), new TeacherSession()));

        ResponseEntity<Map<String, Object>> response = controller.getTeacherHours(teacherId, start, end);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals(0, ((BigDecimal) body.get("totalHours")).compareTo(new BigDecimal("8.0")));
        assertEquals(2, body.get("sessionCount"));
        assertEquals(teacherId, body.get("teacherId"));
        assertEquals(start, body.get("startDate"));
        assertEquals(end, body.get("endDate"));
    }

    @Test
    void getTeacherHours_zeroHoursWhenNoSessions() {
        UUID teacherId = UUID.randomUUID();
        when(teacherSessionService.getTotalHoursForPeriod(any(), any(), any())).thenReturn(BigDecimal.ZERO);
        when(teacherSessionService.getSessionsByTeacherAndDateRange(any(), any(), any())).thenReturn(List.of());

        ResponseEntity<Map<String, Object>> response =
                controller.getTeacherHours(teacherId, LocalDate.now().minusDays(7), LocalDate.now());

        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals(0, ((BigDecimal) body.get("totalHours")).compareTo(BigDecimal.ZERO));
        assertEquals(0, body.get("sessionCount"));
    }
}
