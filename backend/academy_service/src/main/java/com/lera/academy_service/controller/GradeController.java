package com.lera.academy_service.controller;

import com.lera.academy_service.entity.Enrollment;
import com.lera.academy_service.entity.Exam;
import com.lera.academy_service.entity.ExamResult;
import com.lera.academy_service.entity.Student;
import com.lera.academy_service.repository.EnrollmentRepository;
import com.lera.academy_service.repository.ExamRepository;
import com.lera.academy_service.repository.ExamResultRepository;
import com.lera.academy_service.repository.StudentRepository;
import com.lera.academy_service.security.AcademyAuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * GradeController - provides grades data for student/parent dashboards
 * Maps exam results to a simplified grade format
 */
@RestController
@RequestMapping("/api/grades")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class GradeController {

    private final ExamResultRepository examResultRepository;
    private final ExamRepository examRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final AcademyAuthorizationService authz;
    private final com.lera.academy_service.client.NotificationClient notificationClient;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getGrades(
            @RequestParam(required = false) UUID studentId,
            @RequestParam(required = false) UUID classId,
            @RequestParam(required = false) String subject) {

        List<ExamResult> results;
        if (studentId != null) {
            authz.assertCanViewStudent(studentId);
            results = examResultRepository.findByStudentId(studentId);
        } else {
            if (!authz.isOrgWide()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "studentId is required unless you have an org-wide role");
            }
            results = examResultRepository.findAll();
        }

        return ResponseEntity.ok(mapGrades(results, classId, subject));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Map<String, Object>>> getGradesByStudent(@PathVariable UUID studentId) {
        return getGrades(studentId, null, null);
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getGradeSummary(
            @RequestParam(required = false) UUID studentId) {
        List<ExamResult> results;
        if (studentId != null) {
            authz.assertCanViewStudent(studentId);
            results = examResultRepository.findByStudentId(studentId);
        } else {
            if (!authz.isOrgWide()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "studentId is required unless you have an org-wide role");
            }
            results = examResultRepository.findAll();
        }

        Map<String, Object> summary = new HashMap<>();
        int totalGrades = results.size();
        int passed = (int) results.stream().filter(r -> Boolean.TRUE.equals(r.getPassed())).count();
        double avgPercentage = results.stream()
                .filter(r -> r.getPercentage() != null)
                .mapToDouble(r -> r.getPercentage().doubleValue())
                .average()
                .orElse(0);

        summary.put("totalGrades", totalGrades);
        summary.put("passed", passed);
        summary.put("failed", totalGrades - passed);
        summary.put("passRate", totalGrades > 0 ? (passed * 100.0 / totalGrades) : 0);
        summary.put("averagePercentage", avgPercentage);
        return ResponseEntity.ok(summary);
    }

    /** Gradebook grid for one assessment: the exam's class roster × each student's current result. */
    @GetMapping("/gradebook")
    public ResponseEntity<Map<String, Object>> gradebook(@RequestParam UUID examId) {
        authz.assertStaff();
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exam not found"));
        UUID classId = exam.getClassId();
        Set<UUID> studentIds = (classId == null ? List.<Enrollment>of() : enrollmentRepository.findByClassId(classId))
                .stream().filter(e -> !"WITHDRAWN".equalsIgnoreCase(e.getStatus()) && !"DROPPED".equalsIgnoreCase(e.getStatus()))
                .map(Enrollment::getStudentId).filter(Objects::nonNull).collect(Collectors.toCollection(LinkedHashSet::new));
        Map<UUID, ExamResult> existing = examResultRepository.findByExamId(examId).stream()
                .collect(Collectors.toMap(ExamResult::getStudentId, r -> r, (a, b) -> a));
        Map<UUID, String> names = studentRepository.findAllById(studentIds).stream()
                .collect(Collectors.toMap(Student::getId, Student::getFullname, (a, b) -> a));
        List<Map<String, Object>> rows = studentIds.stream().map(sid -> {
            ExamResult r = existing.get(sid);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("studentId", sid);
            m.put("studentName", names.getOrDefault(sid, "—"));
            m.put("score", r != null ? r.getScore() : null);
            m.put("percentage", r != null ? r.getPercentage() : null);
            m.put("grade", r != null ? r.getGrade() : null);
            m.put("passed", r != null ? r.getPassed() : null);
            return m;
        }).collect(Collectors.toList());
        Map<String, Object> examInfo = new LinkedHashMap<>();
        examInfo.put("id", examId);
        examInfo.put("name", exam.getName());
        examInfo.put("classId", classId);
        examInfo.put("maxScore", exam.getMaxScore());
        examInfo.put("passingScore", exam.getPassingScore());
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("exam", examInfo);
        out.put("rows", rows);
        return ResponseEntity.ok(out);
    }

    /** Bulk save/upsert results for one assessment in a single transaction. */
    @PostMapping("/bulk")
    @Transactional
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> bulkSave(@RequestBody Map<String, Object> body) {
        authz.assertStaff();
        if (body.get("examId") == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "examId required");
        UUID examId;
        try { examId = UUID.fromString(body.get("examId").toString()); }
        catch (IllegalArgumentException e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid examId"); }
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exam not found"));
        BigDecimal maxScore = exam.getMaxScore() != null && exam.getMaxScore().signum() > 0 ? exam.getMaxScore() : new BigDecimal("100");
        BigDecimal passing = exam.getPassingScore();
        List<Map<String, Object>> grades = (List<Map<String, Object>>) body.getOrDefault("grades", List.of());
        int saved = 0;
        java.util.Set<UUID> gradedStudentIds = new java.util.HashSet<>();
        for (Map<String, Object> g : grades) {
            if (g.get("studentId") == null || g.get("score") == null || g.get("score").toString().isBlank()) continue;
            UUID sid;
            BigDecimal score;
            try { sid = UUID.fromString(g.get("studentId").toString()); score = new BigDecimal(g.get("score").toString()); }
            catch (Exception e) { continue; }
            ExamResult r = examResultRepository.findByExamIdAndStudentId(examId, sid).orElseGet(() -> {
                ExamResult n = new ExamResult();
                n.setExamId(examId);
                n.setStudentId(sid);
                return n;
            });
            r.setScore(score);
            BigDecimal pct = score.multiply(BigDecimal.valueOf(100)).divide(maxScore, 1, RoundingMode.HALF_UP);
            r.setPercentage(pct);
            r.setPassed(passing != null ? score.compareTo(passing) >= 0 : pct.compareTo(BigDecimal.valueOf(50)) >= 0);
            r.setGrade(letterGrade(pct));
            r.setGradedAt(LocalDateTime.now());
            examResultRepository.save(r);
            saved++;
            gradedStudentIds.add(sid);
        }
        // Notify parents that grades were posted (skips students with no linked parent).
        String examName = exam.getName() != null ? exam.getName() : "an assessment";
        for (Student st : studentRepository.findAllById(gradedStudentIds)) {
            if (st.getParentId() != null) {
                try {
                    notificationClient.notifyExamResults(st.getParentId(), st.getFullname(), examName, examId);
                } catch (Exception ignored) { /* non-blocking */ }
            }
        }
        return ResponseEntity.ok(Map.of("saved", saved));
    }

    private static String letterGrade(BigDecimal pct) {
        double p = pct.doubleValue();
        if (p >= 90) return "A";
        if (p >= 80) return "B";
        if (p >= 70) return "C";
        if (p >= 60) return "D";
        return "F";
    }

    private List<Map<String, Object>> mapGrades(
            List<ExamResult> results, UUID classId, String subject) {
        List<Map<String, Object>> grades = new ArrayList<>();
        for (ExamResult result : results) {
            String subjectName = "General";
            String type = "Assessment";
            BigDecimal maxScore = new BigDecimal("100");

            if (result.getExamId() != null) {
                Optional<Exam> exam = examRepository.findById(result.getExamId());
                if (exam.isPresent()) {
                    Exam e = exam.get();
                    if (e.getName() != null) {
                        subjectName = e.getName();
                    }
                    if (e.getDescription() != null && !e.getDescription().isEmpty()) {
                        type = e.getDescription();
                    }
                    if (e.getMaxScore() != null) {
                        maxScore = e.getMaxScore();
                    }
                    if (classId != null && e.getClassId() != null && !classId.equals(e.getClassId())) {
                        continue;
                    }
                }
            }
            if (subject != null && !subject.equalsIgnoreCase(subjectName)) {
                continue;
            }

            Map<String, Object> grade = new HashMap<>();
            grade.put("id", result.getId());
            grade.put("studentId", result.getStudentId());
            grade.put("subject", subjectName);
            grade.put("courseName", subjectName);
            grade.put("score", result.getScore() != null ? result.getScore() : BigDecimal.ZERO);
            grade.put("maxScore", maxScore);
            grade.put("percentage", result.getPercentage() != null ? result.getPercentage() : BigDecimal.ZERO);
            grade.put("grade", result.getGrade() != null ? result.getGrade() : "");
            grade.put("type", type);
            grade.put("assessmentType", type);
            grade.put("date", result.getCreatedAt() != null ? result.getCreatedAt().toString() : null);
            grade.put("gradedDate", result.getGradedAt() != null ? result.getGradedAt().toString() : null);
            grade.put("feedback", result.getFeedback());
            grade.put("isPassed", result.getPassed());
            grades.add(grade);
        }
        return grades;
    }
}
