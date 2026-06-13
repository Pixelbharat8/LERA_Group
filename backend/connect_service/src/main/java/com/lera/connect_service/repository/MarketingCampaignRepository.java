package com.lera.connect_service.repository;

import com.lera.connect_service.entity.MarketingCampaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MarketingCampaignRepository extends JpaRepository<MarketingCampaign, UUID> {
    Optional<MarketingCampaign> findByCampaignName(String campaignName);
    List<MarketingCampaign> findByCampaignType(String campaignType);
    List<MarketingCampaign> findByStatus(String status);
}
