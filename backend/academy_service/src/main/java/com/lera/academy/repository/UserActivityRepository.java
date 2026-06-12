package com.lera.academy.repository;

import com.lera.academy.entity.UserActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface UserActivityRepository extends JpaRepository<UserActivity, UUID> {
    
    List<UserActivity> findByUserIdOrderByCreatedAtDesc(UUID userId);
    
    Page<UserActivity> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    
    List<UserActivity> findByUserIdAndActivityTypeOrderByCreatedAtDesc(UUID userId, String activityType);
    
    List<UserActivity> findByUserIdAndEntityTypeOrderByCreatedAtDesc(UUID userId, String entityType);
    
    @Query("SELECT ua FROM UserActivity ua WHERE ua.userId = :userId AND ua.createdAt BETWEEN :startDate AND :endDate ORDER BY ua.createdAt DESC")
    List<UserActivity> findByUserIdAndDateRange(
        @Param("userId") UUID userId, 
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT ua FROM UserActivity ua WHERE ua.userId = :userId AND ua.activityType = :activityType AND ua.createdAt BETWEEN :startDate AND :endDate ORDER BY ua.createdAt DESC")
    List<UserActivity> findByUserIdAndActivityTypeAndDateRange(
        @Param("userId") UUID userId, 
        @Param("activityType") String activityType,
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT COUNT(ua) FROM UserActivity ua WHERE ua.userId = :userId")
    long countByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT COUNT(ua) FROM UserActivity ua WHERE ua.userId = :userId AND ua.activityType = :activityType")
    long countByUserIdAndActivityType(@Param("userId") UUID userId, @Param("activityType") String activityType);
}
