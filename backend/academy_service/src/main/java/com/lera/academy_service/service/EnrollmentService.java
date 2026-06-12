package com.lera.academy_service.service;

import com.lera.academy_service.entity.Enrollment;
import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.repository.EnrollmentRepository;
import com.lera.academy_service.repository.ClassRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final ClassRepository classRepository;

    public List<Enrollment> getAllEnrollments() {
        return enrollmentRepository.findAll();
    }

    public Optional<Enrollment> getById(UUID id) {
        return enrollmentRepository.findById(id);
    }

    public List<Enrollment> getByStudentId(UUID studentId) {
        return enrollmentRepository.findByStudentId(studentId);
    }

    public List<Enrollment> getByClassId(UUID classId) {
        return enrollmentRepository.findByClassId(classId);
    }

    public List<Enrollment> getActiveByStudentId(UUID studentId) {
        return enrollmentRepository.findByStudentIdAndStatus(studentId, "ACTIVE");
    }

    /**
     * Enroll a student into a class with validation:
     * - Student must not already be enrolled in the class
     * - Class must exist and be OPEN
     * - Class must not be at max capacity
     */
    @Transactional
    public Enrollment enrollStudent(Enrollment enrollment) {
        // Check duplicate enrollment
        if (enrollmentRepository.existsByStudentIdAndClassId(enrollment.getStudentId(), enrollment.getClassId())) {
            throw new IllegalStateException("Student is already enrolled in this class");
        }

        // Validate class exists and is open
        ClassEntity classEntity = classRepository.findById(enrollment.getClassId())
                .orElseThrow(() -> new IllegalArgumentException("Class not found: " + enrollment.getClassId()));

        if (!"OPEN".equalsIgnoreCase(classEntity.getStatus())) {
            throw new IllegalStateException("Class is not open for enrollment. Current status: " + classEntity.getStatus());
        }

        // Check capacity
        long currentEnrolled = enrollmentRepository.countActiveEnrollmentsByClassId(enrollment.getClassId());
        if (classEntity.getMaxStudents() != null && currentEnrolled >= classEntity.getMaxStudents()) {
            throw new IllegalStateException("Class is at maximum capacity (" + classEntity.getMaxStudents() + " students)");
        }

        // Set defaults
        if (enrollment.getStatus() == null) enrollment.setStatus("ACTIVE");
        if (enrollment.getEnrollmentDate() == null) enrollment.setEnrollmentDate(LocalDate.now());
        if (enrollment.getStartDate() == null) enrollment.setStartDate(LocalDate.now());
        enrollment.setCreatedAt(LocalDateTime.now());
        enrollment.setUpdatedAt(LocalDateTime.now());

        Enrollment saved = enrollmentRepository.save(enrollment);
        log.info("Student {} enrolled in class {} (enrollment {})", enrollment.getStudentId(), enrollment.getClassId(), saved.getId());
        return saved;
    }

    /**
     * Bulk enrollment — skips duplicates, returns only newly enrolled.
     */
    @Transactional
    public List<Enrollment> enrollStudentsBulk(List<Enrollment> enrollments) {
        List<Enrollment> created = new ArrayList<>();
        for (Enrollment enrollment : enrollments) {
            try {
                created.add(enrollStudent(enrollment));
            } catch (IllegalStateException e) {
                log.warn("Skipping enrollment for student {} in class {}: {}",
                        enrollment.getStudentId(), enrollment.getClassId(), e.getMessage());
            }
        }
        return created;
    }

    /**
     * Transfer a student from one class to another.
     */
    @Transactional
    public Enrollment transferStudent(UUID enrollmentId, UUID newClassId) {
        Enrollment existing = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found: " + enrollmentId));

        // Close old enrollment
        existing.setStatus("TRANSFERRED");
        existing.setEndDate(LocalDate.now());
        existing.setUpdatedAt(LocalDateTime.now());
        enrollmentRepository.save(existing);

        // Create new enrollment
        Enrollment newEnrollment = Enrollment.builder()
                .studentId(existing.getStudentId())
                .classId(newClassId)
                .enrollmentDate(LocalDate.now())
                .startDate(LocalDate.now())
                .status("ACTIVE")
                .notes("Transferred from previous enrollment: " + enrollmentId)
                .build();

        return enrollStudent(newEnrollment);
    }

    /**
     * Update enrollment status (ACTIVE, COMPLETED, DROPPED, SUSPENDED, TRANSFERRED).
     */
    @Transactional
    public Enrollment updateStatus(UUID enrollmentId, String newStatus) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found: " + enrollmentId));

        enrollment.setStatus(newStatus);
        if ("COMPLETED".equals(newStatus) || "DROPPED".equals(newStatus) || "TRANSFERRED".equals(newStatus)) {
            if (enrollment.getEndDate() == null) {
                enrollment.setEndDate(LocalDate.now());
            }
        }
        enrollment.setUpdatedAt(LocalDateTime.now());
        Enrollment saved = enrollmentRepository.save(enrollment);
        log.info("Enrollment {} status changed to {}", enrollmentId, newStatus);
        return saved;
    }

    @Transactional
    public void deleteEnrollment(UUID enrollmentId) {
        if (!enrollmentRepository.existsById(enrollmentId)) {
            throw new IllegalArgumentException("Enrollment not found: " + enrollmentId);
        }
        enrollmentRepository.deleteById(enrollmentId);
        log.info("Enrollment {} deleted", enrollmentId);
    }

    public long countActiveByClassId(UUID classId) {
        return enrollmentRepository.countActiveEnrollmentsByClassId(classId);
    }

    public boolean isStudentEnrolled(UUID studentId, UUID classId) {
        return enrollmentRepository.existsByStudentIdAndClassId(studentId, classId);
    }
}
