package com.lera.ai_gateway.repository;

import com.lera.ai_gateway.entity.VideoRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface VideoRequestRepository extends JpaRepository<VideoRequest, UUID> {
    List<VideoRequest> findByRequesterIdOrderByCreatedAtDesc(UUID requesterId);
    List<VideoRequest> findByStatusOrderByCreatedAtDesc(String status);
    List<VideoRequest> findAllByOrderByCreatedAtDesc();
}
