package com.lera.social_media_service.repository;

import com.lera.social_media_service.entity.ContentTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContentTemplateRepository extends JpaRepository<ContentTemplate, UUID> {
    
    List<ContentTemplate> findByIsActiveTrueOrderByUseCountDesc();
    
    List<ContentTemplate> findByTemplateType(String templateType);
    
    List<ContentTemplate> findByCategory(String category);
    
    List<ContentTemplate> findByCategoryAndIsActiveTrue(String category);
    
    List<ContentTemplate> findByCreatedBy(UUID createdBy);
}
