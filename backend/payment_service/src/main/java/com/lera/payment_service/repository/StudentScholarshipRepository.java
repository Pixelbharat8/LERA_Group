package com.lera.payment_service.repository;

import com.lera.payment_service.entity.StudentScholarship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StudentScholarshipRepository extends JpaRepository<StudentScholarship, UUID> {
    List<StudentScholarship> findByStudentId(UUID studentId);
    List<StudentScholarship> findByScholarshipId(UUID scholarshipId);
    List<StudentScholarship> findByStatus(String status);
}
