package com.lera.social_media_service.repository;

import com.lera.social_media_service.entity.CommunityEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CommunityEventRepository extends JpaRepository<CommunityEvent, UUID> {
    List<CommunityEvent> findAllByOrderByEventDateAsc();
    List<CommunityEvent> findByCenterIdOrderByEventDateAsc(UUID centerId);
    List<CommunityEvent> findByStatusOrderByEventDateAsc(String status);
}
