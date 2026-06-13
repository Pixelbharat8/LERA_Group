package com.lera.academy_service.service;

import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.entity.Enrollment;
import com.lera.academy_service.entity.Exam;
import com.lera.academy_service.entity.ExamResult;
import com.lera.academy_service.entity.Student;
import com.lera.academy_service.repository.ClassRepository;
import com.lera.academy_service.repository.EnrollmentRepository;
import com.lera.academy_service.repository.ExamRepository;
import com.lera.academy_service.repository.ExamResultRepository;
import com.lera.academy_service.repository.StudentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Aggregates a per-student progress report (enrolments, exam results + averages, attendance)
 * for parents/staff. Reads the shared DB directly for attendance (JdbcTemplate), like
 * {@link CentreSummaryService}.
 */
@Service
@Slf4j
public class StudentReportCardService {

    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ClassRepository classRepository;
    private final ExamResultRepository examResultRepository;
    private final ExamRepository examRepository;
    private final JdbcTemplate jdbcTemplate;

    public StudentReportCardService(StudentRepository studentRepository, EnrollmentRepository enrollmentRepository,
                                    ClassRepository classRepository, ExamResultRepository examResultRepository,
                                    ExamRepository examRepository, JdbcTemplate jdbcTemplate) {
        this.studentRepository = studentRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.classRepository = classRepository;
        this.examResultRepository = examResultRepository;
        this.examRepository = examRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    public Map<String, Object> buildReportCard(UUID studentId) {
        Student s = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));

        Map<String, Object> out = new LinkedHashMap<>();
        Map<String, Object> student = new LinkedHashMap<>();
        student.put("id", s.getId());
        student.put("fullname", s.getFullname());
        student.put("studentCode", s.getStudentCode());
        student.put("status", s.getStatus());
        out.put("student", student);

        // Enrolments + class names
        List<Enrollment> enrolments = enrollmentRepository.findByStudentId(studentId);
        Map<UUID, String> classNames = classRepository.findAllById(
                enrolments.stream().map(Enrollment::getClassId).filter(Objects::nonNull).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(ClassEntity::getId, ClassEntity::getName, (a, b) -> a));
        out.put("classes", enrolments.stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("classId", e.getClassId());
            m.put("className", e.getClassId() != null ? classNames.getOrDefault(e.getClassId(), "—") : "—");
            m.put("status", e.getStatus());
            return m;
        }).collect(Collectors.toList()));

        // Exam results + names + average
        List<ExamResult> results = examResultRepository.findByStudentId(studentId);
        Map<UUID, String> examNames = examRepository.findAllById(
                results.stream().map(ExamResult::getExamId).filter(Objects::nonNull).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Exam::getId, Exam::getName, (a, b) -> a));
        List<Map<String, Object>> examList = results.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("examId", r.getExamId());
            m.put("examName", r.getExamId() != null ? examNames.getOrDefault(r.getExamId(), "Exam") : "Exam");
            m.put("score", r.getScore());
            m.put("percentage", r.getPercentage());
            m.put("grade", r.getGrade());
            m.put("gradedAt", r.getGradedAt());
            return m;
        }).collect(Collectors.toList());
        out.put("examResults", examList);

        BigDecimal avg = results.stream().map(ExamResult::getPercentage).filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long graded = results.stream().filter(r -> r.getPercentage() != null).count();
        out.put("examCount", results.size());
        out.put("averagePercentage", graded > 0 ? avg.divide(BigDecimal.valueOf(graded), 1, RoundingMode.HALF_UP) : null);

        // Attendance rate (graceful — null if the table/columns differ)
        Double attendance = null;
        try {
            attendance = jdbcTemplate.queryForObject(
                    "SELECT CASE WHEN COUNT(*) = 0 THEN NULL ELSE "
                            + "ROUND(100.0 * COUNT(*) FILTER (WHERE ca.status IN ('PRESENT','LATE')) / COUNT(*), 1) END "
                            + "FROM class_attendance ca WHERE ca.student_id = ?",
                    Double.class, studentId);
        } catch (Exception e) {
            log.debug("attendance rate unavailable: {}", e.getMessage());
        }
        out.put("attendanceRate", attendance);

        return out;
    }
}
