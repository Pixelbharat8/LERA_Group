package com.lera.connect_service.repository;

import com.lera.connect_service.entity.ContentModerationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ContentModerationLogRepository extends JpaRepository<ContentModerationLog, UUID> {
    
    List<ContentModerationLog> findByUserId(UUID userId);
    
    List<ContentModerationLog> findByMessageId(UUID messageId);
    
    List<ContentModerationLog> findByStatus(String status);
    
    @Query("SELECT c FROM ContentModerationLog c WHERE c.status = 'PENDING' ORDER BY c.createdAt ASC")
    List<ContentModerationLog> findPendingReview();
    
    @Query("SELECT c FROM ContentModerationLog c WHERE c.severity = :severity AND c.status = 'PENDING'")
    List<ContentModerationLog> findBySeverityPending(@Param("severity") String severity);
    
    @Query("SELECT c FROM ContentModerationLog c WHERE c.academyId = :academyId AND c.createdAt BETWEEN :start AND :end")
    List<ContentModerationLog> findByAcademyAndDateRange(@Param("academyId") UUID academyId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT c FROM ContentModerationLog c WHERE c.userId = :userId AND c.violationType IS NOT NULL ORDER BY c.createdAt DESC")
    List<ContentModerationLog> findViolationsByUser(@Param("userId") UUID userId);
    
    @Query("SELECT c.violationType, COUNT(c) FROM ContentModerationLog c WHERE c.academyId = :academyId GROUP BY c.violationType")
    List<Object[]> getViolationStatsByAcademy(@Param("academyId") UUID academyId);
    
    @Query("SELECT COUNT(c) FROM ContentModerationLog c WHERE c.userId = :userId AND c.status = 'BLOCKED' AND c.createdAt > :since")
    long countBlockedByUserSince(@Param("userId") UUID userId, @Param("since") LocalDateTime since);
    
    List<ContentModerationLog> findByReviewedById(UUID reviewedById);
    
    @Query("SELECT c FROM ContentModerationLog c WHERE c.isFalsePositive = true ORDER BY c.reviewedAt DESC")
    List<ContentModerationLog> findFalsePositives();
}
