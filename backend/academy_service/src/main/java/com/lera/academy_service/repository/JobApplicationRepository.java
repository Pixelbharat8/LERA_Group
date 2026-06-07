package com.lera.academy_service.repository;

import com.lera.academy_service.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JobApplicationRepository extends JpaRepository<JobApplication, UUID> {

    List<JobApplication> findByJobOpeningIdOrderByAppliedAtDesc(UUID jobOpeningId);

    List<JobApplication> findByStatusOrderByAppliedAtDesc(String status);

    long countByJobOpeningId(UUID jobOpeningId);
}
