package com.lera.social_media_service.repository;

import com.lera.social_media_service.entity.SocialMediaPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SocialMediaPostRepository extends JpaRepository<SocialMediaPost, UUID> {
    
    @Query("SELECT p FROM SocialMediaPost p ORDER BY p.createdAt DESC")
    List<SocialMediaPost> findAllOrderByCreatedAtDesc();
    
    List<SocialMediaPost> findByStatus(String status);
    
    List<SocialMediaPost> findByStatusOrderByScheduledAtDesc(String status);
    
    List<SocialMediaPost> findByCreatedBy(UUID createdBy);
    
    List<SocialMediaPost> findByCampaignId(UUID campaignId);
    
    List<SocialMediaPost> findByScheduledAtBetween(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT p FROM SocialMediaPost p WHERE p.scheduledAt BETWEEN :start AND :end ORDER BY p.scheduledAt ASC")
    List<SocialMediaPost> findByScheduledAtBetweenOrderByScheduledAtAsc(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT p FROM SocialMediaPost p WHERE p.status = 'scheduled' AND p.scheduledAt <= :now")
    List<SocialMediaPost> findPostsReadyToPublish(LocalDateTime now);
    
    @Query("SELECT p FROM SocialMediaPost p WHERE p.status = 'published' ORDER BY p.publishedAt DESC")
    List<SocialMediaPost> findRecentlyPublished();
    
    List<SocialMediaPost> findByPublishedAtBetween(LocalDateTime start, LocalDateTime end);

    // Exclusive bounds (publishedAt > start AND < end), and excludes null publishedAt.
    List<SocialMediaPost> findByPublishedAtAfterAndPublishedAtBefore(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT p FROM SocialMediaPost p WHERE p.status = 'published' ORDER BY p.likes DESC")
    List<SocialMediaPost> findTopByOrderByLikesCountDesc();
    
    @Query("SELECT p FROM SocialMediaPost p WHERE p.status = 'published' ORDER BY p.comments DESC")
    List<SocialMediaPost> findTopByOrderByCommentsCountDesc();
    
    @Query("SELECT p FROM SocialMediaPost p WHERE p.status = 'published' ORDER BY p.shares DESC")
    List<SocialMediaPost> findTopByOrderBySharesCountDesc();
    
    @Query("SELECT p FROM SocialMediaPost p WHERE p.status = 'published' ORDER BY p.impressions DESC")
    List<SocialMediaPost> findTopByOrderByViewsCountDesc();
}
