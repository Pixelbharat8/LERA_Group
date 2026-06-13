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
            List<ExamResult> results = resultsForClass(classId);
            List<Map<String, Object>> response = new ArrayList<>();
            for (ExamResult result : results) {
                response.add(buildResultResponse(result));
            }
            return ResponseEntity.ok(response);
        }
        if (centerId != null) {
            authz.assertStaff();
            UUID effCenter = authz.effectiveListCenterId(centerId);
            List<ExamResult> results = resultsForCenter(effCenter);
            List<Map<String, Object>> response = new ArrayList<>();
            for (ExamResult result : results) {
                response.add(buildResultResponse(result));
            }
            return ResponseEntity.ok(response);
        }
        authz.assertStaff();
        if (!authz.isOrgWide()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Specify classId, centerId, or use /api/exam-results/student/{studentId}");
        }
        List<ExamResult> results = examResultRepository.findAll(pageable).getContent();
        List<Map<String, Object>> response = new ArrayList<>();
        for (ExamResult result : results) {
            response.add(buildResultResponse(result));
        }
        return ResponseEntity.ok(response);
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
        List<Map<String, Object>> response = new ArrayList<>();
        for (ExamResult result : results) {
            response.add(buildResultResponse(result));
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Map<String, Object>>> getResultsByStudent(@PathVariable UUID studentId) {
        authz.assertCanViewStudent(studentId);
        List<ExamResult> results = examResultRepository.findByStudentId(studentId);
        List<Map<String, Object>> response = new ArrayList<>();
        for (ExamResult result : results) {
            response.add(buildResultResponse(result));
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<ExamResult> createResult(@Valid @RequestBody ExamResult result) {
        result.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.ok(examResultRepository.save(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<ExamResult> updateResult(@PathVariable UUID id, @Valid @RequestBody ExamResult resultDetails) {
        return examResultRepository.findById(id).map(result -> {
            if (resultDetails.getScore() != null) result.setScore(resultDetails.getScore());
            if (resultDetails.getPercentage() != null) result.setPercentage(resultDetails.getPercentage());
            if (resultDetails.getGrade() != null) result.setGrade(resultDetails.getGrade());
            if (resultDetails.getPassed() != null) result.setPassed(resultDetails.getPassed());
            if (resultDetails.getFeedback() != null) result.setFeedback(resultDetails.getFeedback());
            if (resultDetails.getGradedBy() != null) {
                result.setGradedBy(resultDetails.getGradedBy());
                result.setGradedAt(LocalDateTime.now());
            }
            return ResponseEntity.ok(examResultRepository.save(result));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<Void> deleteResult(@PathVariable UUID id) {
        if (examResultRepository.existsById(id)) {
            examResultRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    private List<ExamResult> resultsForClass(UUID classId) {
        List<ExamResult> results = new ArrayList<>();
        for (Exam exam : examRepository.findByClassId(classId)) {
            results.addAll(examResultRepository.findByExamId(exam.getId()));
        }
        return results;
    }

    private List<ExamResult> resultsForCenter(UUID centerId) {
        if (centerId == null) {
            return List.of();
        }
        List<ExamResult> results = new ArrayList<>();
        for (ClassEntity clazz : classRepository.findByCenterId(centerId)) {
            results.addAll(resultsForClass(clazz.getId()));
        }
        return results;
    }

    private Map<String, Object> buildResultResponse(ExamResult result) {
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
        item.put("studentName", getStudentName(result.getStudentId()));
        if (result.getExamId() != null) {
            Optional<Exam> exam = examRepository.findById(result.getExamId());
            item.put("examName", exam.map(Exam::getName).orElse("Unknown Exam"));
            item.put("examDate", exam.map(Exam::getExamDate).orElse(null));
        }
        return item;
    }
}
