package com.lera.social_media_service.repository;

import com.lera.social_media_service.entity.MarketingCampaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface MarketingCampaignRepository extends JpaRepository<MarketingCampaign, UUID> {
    
    List<MarketingCampaign> findByStatus(String status);
    
    List<MarketingCampaign> findByCampaignType(String campaignType);
    
    List<MarketingCampaign> findByStatusIn(List<String> statuses);
    
    List<MarketingCampaign> findByStartDateBetween(LocalDate start, LocalDate end);
    
    List<MarketingCampaign> findByCreatedBy(UUID createdBy);
}
