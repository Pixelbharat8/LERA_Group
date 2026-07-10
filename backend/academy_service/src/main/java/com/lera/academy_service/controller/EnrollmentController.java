package com.lera.academy_service.controller;

import com.lera.academy_service.entity.Enrollment;
import com.lera.academy_service.repository.EnrollmentRepository;
import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.service.EnrollmentService;
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
    private final EnrollmentService enrollmentService;
    
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
        // Only into a class the caller may manage (centre-scoped / class-owning).
        authz.assertCanViewClassRoster(enrollment.getClassId());
        // Route through the service so the business rules are actually enforced: no duplicate,
        // class must be OPEN, and capacity (maxStudents) is respected — with a row lock so
        // concurrent enrollments can't overbook.
        try {
            return ResponseEntity.ok(enrollmentService.enrollStudent(enrollment));
        } catch (IllegalStateException e) {          // duplicate / class closed / at capacity
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        } catch (IllegalArgumentException e) {        // class not found
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<List<Enrollment>> createEnrollmentsBulk(@Valid @RequestBody List<Enrollment> enrollments) {
        enrollments.forEach(e -> authz.assertCanViewClassRoster(e.getClassId()));
        // Graceful: enrollStudentsBulk skips rows that are duplicates / over-capacity / into a
        // closed class (logs + continues) and returns only the newly-enrolled — so an import
        // batch is never hard-failed by one full class.
        return ResponseEntity.ok(enrollmentService.enrollStudentsBulk(enrollments));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<Enrollment> updateEnrollment(@PathVariable UUID id, @Valid @RequestBody Enrollment enrollmentDetails) {
        return enrollmentRepository.findById(id).map(enrollment -> {
            authz.assertCanViewClassRoster(enrollment.getClassId());
            if (enrollmentDetails.getStatus() != null) enrollment.setStatus(enrollmentDetails.getStatus());
            if (enrollmentDetails.getEndDate() != null) enrollment.setEndDate(enrollmentDetails.getEndDate());

            return ResponseEntity.ok(enrollmentRepository.save(enrollment));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER')")
    public ResponseEntity<Void> deleteEnrollment(@PathVariable UUID id) {
        return enrollmentRepository.findById(id).map(e -> {
            authz.assertCanViewClassRoster(e.getClassId());
            enrollmentRepository.deleteById(id);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<Enrollment> updateEnrollmentStatus(@PathVariable UUID id, @RequestParam String status) {
        return enrollmentRepository.findById(id).map(enrollment -> {
            authz.assertCanViewClassRoster(enrollment.getClassId());
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
