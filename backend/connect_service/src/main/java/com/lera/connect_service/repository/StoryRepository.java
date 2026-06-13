package com.lera.connect_service.repository;

import com.lera.connect_service.entity.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface StoryRepository extends JpaRepository<Story, UUID> {
    
    // Find active stories for a user
    @Query("SELECT s FROM Story s WHERE s.userId = :userId AND s.isActive = true AND s.expiresAt > :now ORDER BY s.createdAt DESC")
    List<Story> findActiveStoriesByUserId(@Param("userId") UUID userId, @Param("now") LocalDateTime now);
    
    // Find all active stories from users the current user follows (or can see)
    @Query("SELECT s FROM Story s WHERE s.isActive = true AND s.expiresAt > :now ORDER BY s.createdAt DESC")
    List<Story> findAllActiveStories(@Param("now") LocalDateTime now);
    
    // Find stories by user that haven't expired
    List<Story> findByUserIdAndIsActiveTrueAndExpiresAtAfterOrderByCreatedAtDesc(UUID userId, LocalDateTime now);
    
    // Count stories for a user
    @Query("SELECT COUNT(s) FROM Story s WHERE s.userId = :userId AND s.isActive = true AND s.expiresAt > :now")
    long countActiveStoriesByUserId(@Param("userId") UUID userId, @Param("now") LocalDateTime now);
    
    // Find expired stories to clean up
    @Query("SELECT s FROM Story s WHERE s.expiresAt < :now AND s.isActive = true")
    List<Story> findExpiredStories(@Param("now") LocalDateTime now);
}
