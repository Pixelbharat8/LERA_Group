package com.lera.academy_service.controller;

import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.entity.Enrollment;
import com.lera.academy_service.entity.Exam;
import com.lera.academy_service.repository.ClassRepository;
import com.lera.academy_service.repository.EnrollmentRepository;
import com.lera.academy_service.repository.ExamRepository;
import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ExamController {

    private final ExamRepository examRepository;
    private final ClassRepository classRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AcademyAuthorizationService authz;

    @GetMapping
    public ResponseEntity<List<Exam>> getAllExams(
            @RequestParam(required = false) UUID classId,
            @RequestParam(required = false) UUID studentId,
            @RequestParam(required = false) UUID centerId,
            Pageable pageable) {
        if (classId != null) {
            authz.assertCanViewClassRoster(classId);
            return ResponseEntity.ok(examRepository.findByClassId(classId));
        }
        if (studentId != null) {
            authz.assertCanViewStudent(studentId);
            return ResponseEntity.ok(examsForStudentEnrollments(studentId));
        }
        if (centerId != null) {
            authz.assertStaff();
            UUID effCenter = authz.effectiveListCenterId(centerId);
            return ResponseEntity.ok(examsForCenter(effCenter));
        }
        if (!CurrentUser.isStaff()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "classId or studentId is required");
        }
        if (!authz.isOrgWide()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Specify classId, centerId, or studentId unless you have an org-wide role");
        }
        return ResponseEntity.ok(examRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Exam> getExamById(@PathVariable UUID id) {
        return examRepository.findById(id)
                .map(exam -> {
                    if (exam.getClassId() != null) {
                        authz.assertCanViewClassRoster(exam.getClassId());
                    } else if (!CurrentUser.isStaff()) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
                    }
                    return ResponseEntity.ok(exam);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<Exam>> getExamsByClass(@PathVariable UUID classId) {
        authz.assertCanViewClassRoster(classId);
        return ResponseEntity.ok(examRepository.findByClassId(classId));
    }

    @GetMapping("/type/{examTypeId}")
    public ResponseEntity<List<Exam>> getExamsByType(@PathVariable UUID examTypeId) {
        authz.assertStaff();
        return ResponseEntity.ok(examRepository.findByExamTypeId(examTypeId));
    }

    @PostMapping
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<Exam> createExam(@Valid @RequestBody Exam exam) {
        if (exam.getClassId() != null) {
            authz.assertCanViewClassRoster(exam.getClassId());
        }
        return ResponseEntity.ok(examRepository.save(exam));
    }

    @PutMapping("/{id}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<Exam> updateExam(@PathVariable UUID id, @Valid @RequestBody Exam examDetails) {
        return examRepository.findById(id).map(exam -> {
            if (examDetails.getName() != null) exam.setName(examDetails.getName());
            if (examDetails.getExamDate() != null) exam.setExamDate(examDetails.getExamDate());
            if (examDetails.getMaxScore() != null) exam.setMaxScore(examDetails.getMaxScore());
            if (examDetails.getPassingScore() != null) exam.setPassingScore(examDetails.getPassingScore());
            if (examDetails.getDurationMinutes() != null) exam.setDurationMinutes(examDetails.getDurationMinutes());
            if (examDetails.getDescription() != null) exam.setDescription(examDetails.getDescription());
            return ResponseEntity.ok(examRepository.save(exam));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<Void> deleteExam(@PathVariable UUID id) {
        if (examRepository.existsById(id)) {
            examRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    private List<Exam> examsForCenter(UUID centerId) {
        if (centerId == null) {
            return List.of();
        }
        List<Exam> exams = new ArrayList<>();
        for (ClassEntity clazz : classRepository.findByCenterId(centerId)) {
            exams.addAll(examRepository.findByClassId(clazz.getId()));
        }
        return exams;
    }

    private List<Exam> examsForStudentEnrollments(UUID studentId) {
        Set<UUID> classIds = new HashSet<>();
        for (Enrollment e : enrollmentRepository.findByStudentId(studentId)) {
            if (e.getClassId() != null
                    && ("ACTIVE".equalsIgnoreCase(e.getStatus())
                            || "ENROLLED".equalsIgnoreCase(e.getStatus()))) {
                classIds.add(e.getClassId());
            }
        }
        List<Exam> exams = new ArrayList<>();
        for (UUID classId : classIds) {
            exams.addAll(examRepository.findByClassId(classId));
        }
        return exams;
    }
}
