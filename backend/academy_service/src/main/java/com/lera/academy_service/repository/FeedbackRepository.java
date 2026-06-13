package com.lera.academy_service.repository;

import com.lera.academy_service.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {

    @Query("""
            SELECT f FROM Feedback f
            WHERE (:centerId IS NULL OR f.centerId = :centerId)
              AND (:category IS NULL OR f.category = :category)
              AND (:status   IS NULL OR f.status   = :status)
            ORDER BY f.createdAt DESC
            """)
    List<Feedback> search(@Param("centerId") UUID centerId,
                          @Param("category") String category,
                          @Param("status") String status);

    List<Feedback> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Feedback> findByCenterIdOrderByCreatedAtDesc(UUID centerId);

    long countByStatus(String status);

    @Query("SELECT AVG(f.rating) FROM Feedback f")
    Double averageRating();

    @Query("SELECT f.rating, COUNT(f) FROM Feedback f WHERE f.rating IS NOT NULL GROUP BY f.rating")
    List<Object[]> ratingDistribution();

    @Query("SELECT f.category, COUNT(f) FROM Feedback f GROUP BY f.category")
    List<Object[]> categoryBreakdown();
}
