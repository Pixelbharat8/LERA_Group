package com.lera.payment_service.service;

import com.lera.payment_service.entity.StudentScholarship;
import com.lera.payment_service.repository.StudentScholarshipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class StudentScholarshipService {

    private final StudentScholarshipRepository studentScholarshipRepository;

    public Page<StudentScholarship> getAll(Pageable pageable) {
        return studentScholarshipRepository.findAll(pageable);
    }

    public Optional<StudentScholarship> getById(UUID id) {
        return studentScholarshipRepository.findById(id);
    }

    public List<StudentScholarship> getByStudent(UUID studentId) {
        return studentScholarshipRepository.findByStudentId(studentId);
    }

    public List<StudentScholarship> getByScholarship(UUID scholarshipId) {
        return studentScholarshipRepository.findByScholarshipId(scholarshipId);
    }

    public List<StudentScholarship> getByStatus(String status) {
        return studentScholarshipRepository.findByStatus(status);
    }

    @Transactional
    public StudentScholarship create(StudentScholarship ss) {
        if (ss.getStudentId() == null || ss.getScholarshipId() == null) {
            throw new IllegalArgumentException("studentId and scholarshipId are required");
        }
        // Idempotency guard: don't award the same scholarship to the same student twice
        // (a bare save let a double-submit stack duplicate awards). CANCELLED ones don't count.
        boolean duplicate = studentScholarshipRepository.findByStudentId(ss.getStudentId()).stream()
                .anyMatch(x -> ss.getScholarshipId().equals(x.getScholarshipId())
                        && (x.getStatus() == null || !"CANCELLED".equalsIgnoreCase(x.getStatus())));
        if (duplicate) {
            throw new IllegalArgumentException("This student already has that scholarship.");
        }
        log.info("Assigning scholarship {} to student {}", ss.getScholarshipId(), ss.getStudentId());
        return studentScholarshipRepository.save(ss);
    }

    @Transactional
    public Optional<StudentScholarship> update(UUID id, StudentScholarship details) {
        return studentScholarshipRepository.findById(id).map(existing -> {
            details.setId(id);
            return studentScholarshipRepository.save(details);
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (studentScholarshipRepository.existsById(id)) {
            studentScholarshipRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
