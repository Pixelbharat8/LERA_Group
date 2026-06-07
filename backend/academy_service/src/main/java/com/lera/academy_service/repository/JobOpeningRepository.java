package com.lera.academy_service.repository;

import com.lera.academy_service.entity.JobOpening;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JobOpeningRepository extends JpaRepository<JobOpening, UUID> {

    List<JobOpening> findAllByOrderByPostedDateDesc();

    List<JobOpening> findByStatusOrderByPostedDateDesc(String status);

    List<JobOpening> findByCenterIdOrderByPostedDateDesc(UUID centerId);
}
