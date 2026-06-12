package com.lera.social_media_service.service;

import com.lera.social_media_service.entity.*;
import com.lera.social_media_service.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CampaignService {
    
    private final MarketingCampaignRepository campaignRepository;
    private final AdCampaignRepository adCampaignRepository;
    private final SocialAnalyticsRepository analyticsRepository;
    private final LeadRepository leadRepository;
    
    // ===================== MARKETING CAMPAIGN CRUD =====================
    
    public MarketingCampaign createCampaign(MarketingCampaign campaign) {
        campaign.setCreatedAt(LocalDateTime.now());
        campaign.setStatus("DRAFT");
        return campaignRepository.save(campaign);
    }
    
    public MarketingCampaign updateCampaign(UUID id, MarketingCampaign details) {
        MarketingCampaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found: " + id));
        
        if (details.getCampaignName() != null) campaign.setCampaignName(details.getCampaignName());
        if (details.getDescription() != null) campaign.setDescription(details.getDescription());
        if (details.getStatus() != null) campaign.setStatus(details.getStatus());
        if (details.getBudget() != null) campaign.setBudget(details.getBudget());
        if (details.getStartDate() != null) campaign.setStartDate(details.getStartDate());
        if (details.getEndDate() != null) campaign.setEndDate(details.getEndDate());
        
        campaign.setUpdatedAt(LocalDateTime.now());
        
        return campaignRepository.save(campaign);
    }
    
    public void deleteCampaign(UUID id) {
        campaignRepository.deleteById(id);
    }
    
    public Optional<MarketingCampaign> getCampaignById(UUID id) {
        return campaignRepository.findById(id);
    }
    
    public Page<MarketingCampaign> getAllCampaigns(Pageable pageable) {
        return campaignRepository.findAll(pageable);
    }
    
    // ===================== CAMPAIGN QUERIES =====================
    
    public List<MarketingCampaign> getCampaignsByStatus(String status) {
        return campaignRepository.findByStatus(status);
    }
    
    public List<MarketingCampaign> getActiveCampaigns() {
        return campaignRepository.findByStatus("ACTIVE");
    }
    
    public List<MarketingCampaign> getCampaignsByType(String type) {
        return campaignRepository.findByCampaignType(type);
    }
    
    public List<MarketingCampaign> getCampaignsByDateRange(LocalDate start, LocalDate end) {
        return campaignRepository.findByStartDateBetween(start, end);
    }
    
    // ===================== CAMPAIGN LIFECYCLE =====================
    
    public MarketingCampaign startCampaign(UUID id) {
        MarketingCampaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found: " + id));
        
        campaign.setStatus("ACTIVE");
        campaign.setStartDate(LocalDate.now());
        campaign.setUpdatedAt(LocalDateTime.now());
        
        log.info("Campaign started: {} (ID: {})", campaign.getCampaignName(), id);
        return campaignRepository.save(campaign);
    }
    
    public MarketingCampaign pauseCampaign(UUID id) {
        MarketingCampaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found: " + id));
        
        campaign.setStatus("PAUSED");
        campaign.setUpdatedAt(LocalDateTime.now());
        
        log.info("Campaign paused: {} (ID: {})", campaign.getCampaignName(), id);
        return campaignRepository.save(campaign);
    }
    
    public MarketingCampaign completeCampaign(UUID id) {
        MarketingCampaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found: " + id));
        
        campaign.setStatus("COMPLETED");
        campaign.setEndDate(LocalDate.now());
        campaign.setUpdatedAt(LocalDateTime.now());
        
        log.info("Campaign completed: {} (ID: {})", campaign.getCampaignName(), id);
        return campaignRepository.save(campaign);
    }
    
    // ===================== AD CAMPAIGN MANAGEMENT =====================
    
    public AdCampaign createAdCampaign(AdCampaign adCampaign) {
        adCampaign.setCreatedAt(LocalDateTime.now());
        adCampaign.setStatus("DRAFT");
        return adCampaignRepository.save(adCampaign);
    }
    
    public AdCampaign updateAdCampaign(UUID id, AdCampaign details) {
        AdCampaign adCampaign = adCampaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ad campaign not found: " + id));
        
        if (details.getCampaignName() != null) adCampaign.setCampaignName(details.getCampaignName());
        if (details.getStatus() != null) adCampaign.setStatus(details.getStatus());
        if (details.getDailyBudget() != null) adCampaign.setDailyBudget(details.getDailyBudget());
        if (details.getLifetimeBudget() != null) adCampaign.setLifetimeBudget(details.getLifetimeBudget());
        
        adCampaign.setUpdatedAt(LocalDateTime.now());
        
        return adCampaignRepository.save(adCampaign);
    }
    
    public void deleteAdCampaign(UUID id) {
        adCampaignRepository.deleteById(id);
    }
    
    public List<AdCampaign> getAdCampaignsByAccountId(UUID accountId) {
        return adCampaignRepository.findByAdAccountId(accountId);
    }
    
    public List<AdCampaign> getAdCampaignsByStatus(String status) {
        return adCampaignRepository.findByStatus(status);
    }
    
    public List<AdCampaign> getActiveAdCampaigns() {
        return adCampaignRepository.findByStatus("ACTIVE");
    }
    
    // ===================== CAMPAIGN ANALYTICS =====================
    
    public Map<String, Object> getCampaignPerformance(UUID campaignId) {
        MarketingCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaign not found: " + campaignId));
        
        Map<String, Object> performance = new HashMap<>();
        
        performance.put("campaign", campaign);
        
        // Get leads attributed to this campaign
        List<Lead> campaignLeads = leadRepository.findAll().stream()
                .filter(l -> campaignId.equals(l.getCampaignId()))
                .toList();
        performance.put("totalLeads", campaignLeads.size());
        
        // Calculate conversion metrics
        long convertedLeads = campaignLeads.stream()
                .filter(l -> "CONVERTED".equals(l.getStatus()))
                .count();
        performance.put("convertedLeads", convertedLeads);
        performance.put("conversionRate", campaignLeads.size() > 0 ? 
                (double) convertedLeads / campaignLeads.size() * 100 : 0);
        
        // Calculate ROI if budget is set
        if (campaign.getBudget() != null && campaign.getBudget().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal estimatedRevenue = BigDecimal.valueOf(convertedLeads * 1000);
            BigDecimal roi = estimatedRevenue.subtract(campaign.getBudget())
                    .divide(campaign.getBudget(), 2, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            performance.put("estimatedROI", roi);
        }
        
        return performance;
    }
    
    public Map<String, Object> getCampaignSummary() {
        Map<String, Object> summary = new HashMap<>();
        
        summary.put("totalCampaigns", campaignRepository.count());
        summary.put("activeCampaigns", campaignRepository.findByStatus("ACTIVE").size());
        summary.put("draftCampaigns", campaignRepository.findByStatus("DRAFT").size());
        summary.put("completedCampaigns", campaignRepository.findByStatus("COMPLETED").size());
        
        // Budget summary
        List<MarketingCampaign> allCampaigns = campaignRepository.findAll();
        BigDecimal totalBudget = allCampaigns.stream()
                .filter(c -> c.getBudget() != null)
                .map(MarketingCampaign::getBudget)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        summary.put("totalBudget", totalBudget);
        
        // Active campaign budget
        List<MarketingCampaign> activeCampaigns = campaignRepository.findByStatus("ACTIVE");
        BigDecimal activeBudget = activeCampaigns.stream()
                .filter(c -> c.getBudget() != null)
                .map(MarketingCampaign::getBudget)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        summary.put("activeBudget", activeBudget);
        
        return summary;
    }
    
    public List<Map<String, Object>> getCampaignComparison(List<UUID> campaignIds) {
        List<Map<String, Object>> comparison = new ArrayList<>();
        
        for (UUID id : campaignIds) {
            Map<String, Object> performance = getCampaignPerformance(id);
            comparison.add(performance);
        }
        
        return comparison;
    }
    
    // ===================== AD SPEND TRACKING =====================
    
    public void updateAdSpend(UUID adCampaignId, BigDecimal spend) {
        AdCampaign adCampaign = adCampaignRepository.findById(adCampaignId)
                .orElseThrow(() -> new RuntimeException("Ad campaign not found: " + adCampaignId));
        
        BigDecimal currentSpend = adCampaign.getSpentAmount() != null ? 
                adCampaign.getSpentAmount() : BigDecimal.ZERO;
        adCampaign.setSpentAmount(currentSpend.add(spend));
        adCampaign.setUpdatedAt(LocalDateTime.now());
        
        // Check if budget exceeded
        if (adCampaign.getLifetimeBudget() != null && 
            adCampaign.getSpentAmount().compareTo(adCampaign.getLifetimeBudget()) >= 0) {
            adCampaign.setStatus("BUDGET_EXHAUSTED");
            log.warn("Ad campaign budget exhausted: {} (ID: {})", adCampaign.getCampaignName(), adCampaignId);
        }
        
        adCampaignRepository.save(adCampaign);
    }
    
    public Map<String, Object> getAdSpendSummary() {
        Map<String, Object> summary = new HashMap<>();
        
        List<AdCampaign> adCampaigns = adCampaignRepository.findAll();
        
        BigDecimal totalSpent = adCampaigns.stream()
                .filter(c -> c.getSpentAmount() != null)
                .map(AdCampaign::getSpentAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalBudget = adCampaigns.stream()
                .filter(c -> c.getLifetimeBudget() != null)
                .map(AdCampaign::getLifetimeBudget)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        summary.put("totalSpent", totalSpent);
        summary.put("totalBudget", totalBudget);
        summary.put("remainingBudget", totalBudget.subtract(totalSpent));
        summary.put("utilizationRate", totalBudget.compareTo(BigDecimal.ZERO) > 0 ?
                totalSpent.divide(totalBudget, 4, java.math.RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)) : BigDecimal.ZERO);
        
        return summary;
    }
}
