package com.lera.social_media_service.repository;

import com.lera.social_media_service.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LeadRepository extends JpaRepository<Lead, UUID> {
    
    List<Lead> findAllByOrderByCreatedAtDesc();
    
    List<Lead> findByStatusOrderByCreatedAtDesc(String status);
    
    List<Lead> findByCenterIdOrderByCreatedAtDesc(UUID centerId);
    
    List<Lead> findByCampaignId(UUID campaignId);
    
    List<Lead> findBySourcePlatform(String sourcePlatform);
    
    List<Lead> findByAssignedTo(UUID assignedTo);
    
    long countByStatus(String status);
    
    long countByCampaignId(UUID campaignId);
    
    long countBySourcePlatform(String sourcePlatform);
}
