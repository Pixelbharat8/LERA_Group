package com.lera.payment_service.repository;

import com.lera.payment_service.entity.Scholarship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ScholarshipRepository extends JpaRepository<Scholarship, UUID> {
    List<Scholarship> findByIsActiveTrue();
    Optional<Scholarship> findByScholarshipCode(String scholarshipCode);
    List<Scholarship> findByScholarshipType(String scholarshipType);
}
