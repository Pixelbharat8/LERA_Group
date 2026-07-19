package com.lera.social_media_service.repository;

import com.lera.social_media_service.entity.SocialMediaPost;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SocialMediaPostRepository extends JpaRepository<SocialMediaPost, UUID> {

    /** Atomically claim a due scheduled post for the scheduler: flips
     *  scheduled -> publishing and returns 1 only for the caller that won. A
     *  concurrent sweep (another instance / thread) gets 0 and must skip it,
     *  so the post is published exactly once. Own transaction => the flip is
     *  visible immediately. */
    @Transactional
    @Modifying
    @Query("UPDATE SocialMediaPost p SET p.status = 'publishing' WHERE p.id = :id AND p.status = 'scheduled'")
    int claimScheduledForPublishing(@Param("id") UUID id);

    /** Atomically claim a post for a manual "Publish now": flips any non-terminal
     *  status to publishing, returning 0 if it's already publishing/published so
     *  a double-click or a race with the scheduler can't re-post it. */
    @Transactional
    @Modifying
    @Query("UPDATE SocialMediaPost p SET p.status = 'publishing' WHERE p.id = :id AND p.status NOT IN ('publishing','published')")
    int claimForManualPublish(@Param("id") UUID id);

    /** Case-insensitive status count done in the DB (avoids loading every post for the dashboard). */
    @Query("SELECT COUNT(p) FROM SocialMediaPost p WHERE UPPER(p.status) = UPPER(:status)")
    long countByStatusIgnoreCase(String status);

    /** Top-N posts by likes, computed + limited in the DB rather than sorting the whole table in memory. */
    @Query("SELECT p FROM SocialMediaPost p ORDER BY COALESCE(p.likes, 0) DESC")
    List<SocialMediaPost> findTopByLikes(Pageable pageable);

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

    // DB-side count of posts published since {@code start} (null publishedAt excluded).
    long countByPublishedAtAfter(LocalDateTime start);
    
    @Query("SELECT p FROM SocialMediaPost p WHERE p.status = 'published' ORDER BY p.likes DESC")
    List<SocialMediaPost> findTopByOrderByLikesCountDesc();
    
    @Query("SELECT p FROM SocialMediaPost p WHERE p.status = 'published' ORDER BY p.comments DESC")
    List<SocialMediaPost> findTopByOrderByCommentsCountDesc();
    
    @Query("SELECT p FROM SocialMediaPost p WHERE p.status = 'published' ORDER BY p.shares DESC")
    List<SocialMediaPost> findTopByOrderBySharesCountDesc();
    
    @Query("SELECT p FROM SocialMediaPost p WHERE p.status = 'published' ORDER BY p.impressions DESC")
    List<SocialMediaPost> findTopByOrderByViewsCountDesc();
}
