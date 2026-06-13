package com.lera.social_media_service.repository;

import com.lera.social_media_service.entity.AdCampaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AdCampaignRepository extends JpaRepository<AdCampaign, UUID> {
    
    List<AdCampaign> findByAdAccountId(UUID adAccountId);
    
    List<AdCampaign> findByStatus(String status);
    
    List<AdCampaign> findByAdAccountIdAndStatus(UUID adAccountId, String status);
    
    List<AdCampaign> findByObjective(String objective);
}
