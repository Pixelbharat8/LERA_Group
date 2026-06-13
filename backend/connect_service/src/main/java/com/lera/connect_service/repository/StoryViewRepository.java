package com.lera.connect_service.repository;

import com.lera.connect_service.entity.StoryView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoryViewRepository extends JpaRepository<StoryView, UUID> {
    
    // Find all views for a story
    List<StoryView> findByStoryIdOrderByViewedAtDesc(UUID storyId);
    
    // Check if a user has viewed a story
    Optional<StoryView> findByStoryIdAndViewerId(UUID storyId, UUID viewerId);
    
    // Count views for a story
    long countByStoryId(UUID storyId);
    
    // Find viewers with reactions
    @Query("SELECT sv FROM StoryView sv WHERE sv.storyId = :storyId AND sv.reaction IS NOT NULL")
    List<StoryView> findViewsWithReactions(@Param("storyId") UUID storyId);
}
