package com.lera.academy_service.controller;

import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.entity.Exam;
import com.lera.academy_service.entity.ExamResult;
import com.lera.academy_service.entity.Student;
import com.lera.academy_service.repository.ClassRepository;
import com.lera.academy_service.repository.ExamRepository;
import com.lera.academy_service.repository.ExamResultRepository;
import com.lera.academy_service.repository.StudentRepository;
import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.service.ExamResultService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/exam-results")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ExamResultController {

    private final ExamResultRepository examResultRepository;
    private final ExamRepository examRepository;
    private final ClassRepository classRepository;
    private final StudentRepository studentRepository;
    private final AcademyAuthorizationService authz;
    private final ExamResultService examResultService;

    private String getStudentName(UUID studentId) {
        if (studentId == null) return "Unknown Student";
        try {
            Optional<Student> student = studentRepository.findById(studentId);
            if (student.isPresent()) {
                String name = student.get().getFullname();
                if (name != null && !name.isEmpty()) return name;
            }
        } catch (Exception e) {
            // Fallback
        }
        return "Student " + studentId.toString().substring(0, 8);
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllResults(
            @RequestParam(required = false) UUID classId,
            @RequestParam(required = false) UUID centerId,
            Pageable pageable) {
        if (classId != null) {
            authz.assertCanViewClassRoster(classId);
            return ResponseEntity.ok(buildResultResponses(resultsForClass(classId)));
        }
        if (centerId != null) {
            authz.assertStaff();
            UUID effCenter = authz.effectiveListCenterId(centerId);
            return ResponseEntity.ok(buildResultResponses(resultsForCenter(effCenter)));
        }
        authz.assertStaff();
        if (!authz.isOrgWide()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Specify classId, centerId, or use /api/exam-results/student/{studentId}");
        }
        List<ExamResult> results = examResultRepository.findAll(pageable).getContent();
        return ResponseEntity.ok(buildResultResponses(results));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getResultById(@PathVariable UUID id) {
        return examResultRepository.findById(id)
                .map(result -> {
                    authz.assertCanViewStudent(result.getStudentId());
                    return ResponseEntity.ok(buildResultResponse(result));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/exam/{examId}")
    public ResponseEntity<List<Map<String, Object>>> getResultsByExam(@PathVariable UUID examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (exam.getClassId() != null) {
            authz.assertCanViewClassRoster(exam.getClassId());
        } else {
            authz.assertStaff();
        }
        List<ExamResult> results = examResultRepository.findByExamId(examId);
        return ResponseEntity.ok(buildResultResponses(results));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Map<String, Object>>> getResultsByStudent(@PathVariable UUID studentId) {
        authz.assertCanViewStudent(studentId);
        List<ExamResult> results = examResultRepository.findByStudentId(studentId);
        return ResponseEntity.ok(buildResultResponses(results));
    }

    /** Resolve an exam's class and enforce teacher-ownership / centre-scope for grading. */
    private void assertCanGradeExam(UUID examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Exam not found"));
        authz.assertCanViewClassRoster(exam.getClassId());
    }

    @PostMapping
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<ExamResult> createResult(@Valid @RequestBody ExamResult result) {
        // A teacher may only record results for a class they teach; managers only their centre.
        assertCanGradeExam(result.getExamId());
        result.setCreatedAt(LocalDateTime.now());
        // Validate score/percentage bounds via the service (was saved unvalidated before).
        try {
            return ResponseEntity.ok(examResultService.save(result));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<ExamResult> updateResult(@PathVariable UUID id, @Valid @RequestBody ExamResult resultDetails) {
        return examResultRepository.findById(id).map(result -> {
            assertCanGradeExam(result.getExamId());
            if (resultDetails.getScore() != null) result.setScore(resultDetails.getScore());
            if (resultDetails.getPercentage() != null) result.setPercentage(resultDetails.getPercentage());
            if (resultDetails.getGrade() != null) result.setGrade(resultDetails.getGrade());
            if (resultDetails.getPassed() != null) result.setPassed(resultDetails.getPassed());
            if (resultDetails.getFeedback() != null) result.setFeedback(resultDetails.getFeedback());
            if (resultDetails.getGradedBy() != null) {
                result.setGradedBy(resultDetails.getGradedBy());
                result.setGradedAt(LocalDateTime.now());
            }
            // Re-validate on edit so a PUT can't set an out-of-bounds score/percentage.
            try {
                return ResponseEntity.ok(examResultService.save(result));
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<Void> deleteResult(@PathVariable UUID id) {
        return examResultRepository.findById(id).map(result -> {
            assertCanGradeExam(result.getExamId());
            examResultRepository.deleteById(id);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    // Both of these used to query once per exam, and resultsForCenter nested that inside a loop
    // over the centre's classes. A centre of 20 classes with 6 exams each cost 1 + 20 + 120
    // queries just to GATHER the rows, before rendering them.
    private List<ExamResult> resultsForClass(UUID classId) {
        return resultsForExams(examRepository.findByClassId(classId));
    }

    private List<ExamResult> resultsForCenter(UUID centerId) {
        if (centerId == null) {
            return List.of();
        }
        List<UUID> classIds = classRepository.findByCenterId(centerId).stream()
                .map(ClassEntity::getId).filter(Objects::nonNull).toList();
        if (classIds.isEmpty()) {
            return List.of();
        }
        return resultsForExams(examRepository.findByClassIdIn(classIds));
    }

    private List<ExamResult> resultsForExams(List<Exam> exams) {
        List<UUID> examIds = exams.stream().map(Exam::getId).filter(Objects::nonNull).toList();
        return examIds.isEmpty() ? List.of() : examResultRepository.findByExamIdIn(examIds);
    }

    /**
     * Render a whole list of results with two lookups in total. buildResultResponse resolves the
     * student and the exam for ONE row, so rendering a centre's results called findById twice per
     * row — on 3,000 results that is 6,000 queries, and the exams had already been loaded and
     * thrown away while gathering.
     */
    private List<Map<String, Object>> buildResultResponses(List<ExamResult> results) {
        Set<UUID> studentIds = results.stream().map(ExamResult::getStudentId)
                .filter(Objects::nonNull).collect(java.util.stream.Collectors.toSet());
        Set<UUID> examIds = results.stream().map(ExamResult::getExamId)
                .filter(Objects::nonNull).collect(java.util.stream.Collectors.toSet());

        Map<UUID, Student> students = studentIds.isEmpty() ? Map.of()
                : studentRepository.findAllById(studentIds).stream()
                    .collect(java.util.stream.Collectors.toMap(Student::getId, x -> x, (a, b) -> a));
        Map<UUID, Exam> exams = examIds.isEmpty() ? Map.of()
                : examRepository.findAllById(examIds).stream()
                    .collect(java.util.stream.Collectors.toMap(Exam::getId, x -> x, (a, b) -> a));

        List<Map<String, Object>> out = new ArrayList<>(results.size());
        for (ExamResult r : results) {
            out.add(buildResultResponse(r, students, exams));
        }
        return out;
    }

    /** Single-row render: resolves its own student and exam. Use buildResultResponses for lists. */
    private Map<String, Object> buildResultResponse(ExamResult result) {
        Map<UUID, Student> student = result.getStudentId() == null ? Map.of()
                : studentRepository.findById(result.getStudentId())
                    .map(x -> Map.of(result.getStudentId(), x)).orElse(Map.of());
        Map<UUID, Exam> exam = result.getExamId() == null ? Map.of()
                : examRepository.findById(result.getExamId())
                    .map(x -> Map.of(result.getExamId(), x)).orElse(Map.of());
        return buildResultResponse(result, student, exam);
    }

    private Map<String, Object> buildResultResponse(ExamResult result,
                                                   Map<UUID, Student> students,
                                                   Map<UUID, Exam> exams) {
        Map<String, Object> item = new HashMap<>();
        item.put("id", result.getId());
        item.put("examId", result.getExamId());
        item.put("studentId", result.getStudentId());
        item.put("score", result.getScore());
        item.put("percentage", result.getPercentage());
        item.put("grade", result.getGrade());
        item.put("passed", result.getPassed());
        item.put("feedback", result.getFeedback());
        item.put("gradedBy", result.getGradedBy());
        item.put("gradedAt", result.getGradedAt());
        item.put("createdAt", result.getCreatedAt());
        Student student = result.getStudentId() == null ? null : students.get(result.getStudentId());
        String name = student == null ? null : student.getFullname();
        item.put("studentName", name == null || name.isEmpty() ? "Unknown Student" : name);
        if (result.getExamId() != null) {
            Exam exam = exams.get(result.getExamId());
            item.put("examName", exam == null ? "Unknown Exam" : exam.getName());
            item.put("examDate", exam == null ? null : exam.getExamDate());
        }
        return item;
    }
}
