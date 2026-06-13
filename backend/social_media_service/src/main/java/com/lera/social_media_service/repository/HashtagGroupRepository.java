package com.lera.social_media_service.repository;

import com.lera.social_media_service.entity.HashtagGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HashtagGroupRepository extends JpaRepository<HashtagGroup, UUID> {
    
    List<HashtagGroup> findByIsActiveTrueOrderByUseCountDesc();
    
    List<HashtagGroup> findByCategory(String category);
    
    List<HashtagGroup> findByCategoryAndIsActiveTrue(String category);
}
