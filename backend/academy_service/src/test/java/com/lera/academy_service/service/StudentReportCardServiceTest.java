package com.lera.academy_service.service;

import com.lera.academy_service.entity.ExamResult;
import com.lera.academy_service.entity.Student;
import com.lera.academy_service.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentReportCardServiceTest {

    @Mock private StudentRepository studentRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private ClassRepository classRepository;
    @Mock private ExamResultRepository examResultRepository;
    @Mock private ExamRepository examRepository;
    @Mock private JdbcTemplate jdbcTemplate;

    private StudentReportCardService service() {
        return new StudentReportCardService(studentRepository, enrollmentRepository, classRepository,
                examResultRepository, examRepository, jdbcTemplate);
    }

    private static ExamResult result(String pct) {
        ExamResult e = new ExamResult();
        if (pct != null) e.setPercentage(new BigDecimal(pct));
        return e;
    }

    private void stubStudentWithResults(UUID id, List<ExamResult> results) {
        Student s = new Student();
        s.setId(id);
        s.setFullname("Nguyen Van A");
        when(studentRepository.findById(id)).thenReturn(Optional.of(s));
        when(enrollmentRepository.findByStudentId(id)).thenReturn(List.of());
        when(classRepository.findAllById(any())).thenReturn(List.of());
        when(examResultRepository.findByStudentId(id)).thenReturn(results);
        when(examRepository.findAllById(any())).thenReturn(List.of());
        // jdbcTemplate (attendance) left unstubbed → returns null → attendanceRate null.
    }

    @Test
    void throwsNotFoundWhenStudentMissing() {
        UUID id = UUID.randomUUID();
        when(studentRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> service().buildReportCard(id));
    }

    @Test
    void averagesNonNullPercentages() {
        UUID id = UUID.randomUUID();
        stubStudentWithResults(id, List.of(result("80"), result("90"), result("100")));

        Map<String, Object> card = service().buildReportCard(id);

        assertEquals(3, card.get("examCount"));
        assertEquals(0, ((BigDecimal) card.get("averagePercentage")).compareTo(new BigDecimal("90.0")));
        assertNull(card.get("attendanceRate"));
    }

    @Test
    void excludesNullPercentagesFromAverageButCountsAllExams() {
        UUID id = UUID.randomUUID();
        stubStudentWithResults(id, List.of(result("80"), result(null), result("100")));

        Map<String, Object> card = service().buildReportCard(id);

        assertEquals(3, card.get("examCount"));               // size includes the ungraded one
        assertEquals(0, ((BigDecimal) card.get("averagePercentage")).compareTo(new BigDecimal("90.0"))); // (80+100)/2
    }

    @Test
    void averageIsNullWhenNoGradedResults() {
        UUID id = UUID.randomUUID();
        stubStudentWithResults(id, List.of(result(null)));

        Map<String, Object> card = service().buildReportCard(id);

        assertEquals(1, card.get("examCount"));
        assertNull(card.get("averagePercentage"));
    }
}
