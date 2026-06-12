package com.lera.academy_service.controller;

import com.lera.academy_service.entity.Enrollment;
import com.lera.academy_service.repository.EnrollmentRepository;
import com.lera.academy_service.security.AcademyAuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {
    
    private final EnrollmentRepository enrollmentRepository;
    private final AcademyAuthorizationService authz;
    
    @GetMapping
    public ResponseEntity<List<Enrollment>> getAllEnrollments(
            @RequestParam(required = false) UUID classId,
            @RequestParam(required = false) UUID studentId,
            @RequestParam(required = false) UUID centerId,
            @RequestParam(required = false) String status) {
        if (classId != null) {
            authz.assertCanViewClassRoster(classId);
            return ResponseEntity.ok(enrollmentRepository.findByClassId(classId));
        }
        if (studentId != null) {
            authz.assertCanViewStudent(studentId);
            return ResponseEntity.ok(enrollmentRepository.findByStudentId(studentId));
        }
        UUID effCenter = authz.effectiveListCenterId(centerId);
        if (effCenter != null) {
            authz.assertStaff();
            return ResponseEntity.ok(enrollmentRepository.findByCenterId(effCenter));
        }
        authz.assertStaff();
        if (!authz.isOrgWide()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "centerId is required for enrollment list queries unless you have an org-wide role");
        }
        return ResponseEntity.ok(enrollmentRepository.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Enrollment> getEnrollmentById(@PathVariable UUID id) {
        return enrollmentRepository.findById(id)
                .map(e -> {
                    authz.assertCanViewEnrollment(e);
                    return ResponseEntity.ok(e);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Enrollment>> getEnrollmentsByStudent(@PathVariable UUID studentId) {
        authz.assertCanViewStudent(studentId);
        return ResponseEntity.ok(enrollmentRepository.findByStudentId(studentId));
    }
    
    @GetMapping("/class/{classId}")
    public ResponseEntity<List<Enrollment>> getEnrollmentsByClass(@PathVariable UUID classId) {
        authz.assertCanViewClassRoster(classId);
        return ResponseEntity.ok(enrollmentRepository.findByClassId(classId));
    }
    
    @GetMapping("/class/{classId}/active/count")
    public ResponseEntity<Long> countActiveEnrollments(@PathVariable UUID classId) {
        authz.assertCanViewClassRoster(classId);
        return ResponseEntity.ok(enrollmentRepository.countActiveEnrollmentsByClassId(classId));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<Enrollment> createEnrollment(@Valid @RequestBody Enrollment enrollment) {
        if (enrollmentRepository.existsByStudentIdAndClassId(enrollment.getStudentId(), enrollment.getClassId())) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(enrollmentRepository.save(enrollment));
    }
    
    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<List<Enrollment>> createEnrollmentsBulk(@Valid @RequestBody List<Enrollment> enrollments) {
        List<Enrollment> validEnrollments = enrollments.stream()
                .filter(e -> !enrollmentRepository.existsByStudentIdAndClassId(e.getStudentId(), e.getClassId()))
                .toList();
        List<Enrollment> savedEnrollments = enrollmentRepository.saveAll(validEnrollments);
        return ResponseEntity.ok(savedEnrollments);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<Enrollment> updateEnrollment(@PathVariable UUID id, @Valid @RequestBody Enrollment enrollmentDetails) {
        return enrollmentRepository.findById(id).map(enrollment -> {
            if (enrollmentDetails.getStatus() != null) enrollment.setStatus(enrollmentDetails.getStatus());
            if (enrollmentDetails.getEndDate() != null) enrollment.setEndDate(enrollmentDetails.getEndDate());
            
            return ResponseEntity.ok(enrollmentRepository.save(enrollment));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER')")
    public ResponseEntity<Void> deleteEnrollment(@PathVariable UUID id) {
        if (enrollmentRepository.existsById(id)) {
            enrollmentRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<Enrollment> updateEnrollmentStatus(@PathVariable UUID id, @RequestParam String status) {
        return enrollmentRepository.findById(id).map(enrollment -> {
            enrollment.setStatus(status);
            return ResponseEntity.ok(enrollmentRepository.save(enrollment));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/check")
    public ResponseEntity<Boolean> checkEnrollment(@RequestParam UUID studentId, @RequestParam UUID classId) {
        authz.assertCanViewStudent(studentId);
        authz.assertCanViewClassRoster(classId);
        return ResponseEntity.ok(enrollmentRepository.existsByStudentIdAndClassId(studentId, classId));
    }
}
