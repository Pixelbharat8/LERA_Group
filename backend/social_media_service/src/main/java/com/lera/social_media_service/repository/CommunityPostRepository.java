package com.lera.social_media_service.repository;

import com.lera.social_media_service.entity.CommunityPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, UUID> {
    List<CommunityPost> findAllByOrderByCreatedAtDesc();
    List<CommunityPost> findByCenterIdOrderByCreatedAtDesc(UUID centerId);
}
