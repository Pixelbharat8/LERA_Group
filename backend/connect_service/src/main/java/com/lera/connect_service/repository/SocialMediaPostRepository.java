package com.lera.connect_service.repository;

import com.lera.connect_service.entity.SocialMediaPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SocialMediaPostRepository extends JpaRepository<SocialMediaPost, UUID> {
    
    List<SocialMediaPost> findByStatus(String status);
    
    List<SocialMediaPost> findByCreatedBy(UUID createdBy);
    
    @Query("SELECT p FROM SocialMediaPost p WHERE p.scheduledAt BETWEEN :start AND :end")
    List<SocialMediaPost> findByScheduledAtBetween(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT p FROM SocialMediaPost p WHERE p.status = 'scheduled' AND p.scheduledAt <= :now")
    List<SocialMediaPost> findPostsReadyToPublish(LocalDateTime now);
    
    List<SocialMediaPost> findByStatusOrderByScheduledAtDesc(String status);
    
    @Query("SELECT p FROM SocialMediaPost p ORDER BY p.createdAt DESC")
    List<SocialMediaPost> findAllOrderByCreatedAtDesc();
}
