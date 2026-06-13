package com.lera.academy_service.repository;

import com.lera.academy_service.entity.PerformanceReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface PerformanceReviewRepository extends JpaRepository<PerformanceReview, UUID> {

    List<PerformanceReview> findAllByOrderByReviewDateDesc();

    List<PerformanceReview> findByStatusOrderByReviewDateDesc(String status);

    List<PerformanceReview> findByCenterIdOrderByReviewDateDesc(UUID centerId);

    List<PerformanceReview> findByEmployeeIdOrderByReviewDateDesc(UUID employeeId);

    List<PerformanceReview> findByReviewerIdOrderByReviewDateDesc(UUID reviewerId);

    long countByStatus(String status);

    @Query("SELECT AVG(p.overallRating) FROM PerformanceReview p WHERE p.overallRating IS NOT NULL")
    Double averageRating();
}
