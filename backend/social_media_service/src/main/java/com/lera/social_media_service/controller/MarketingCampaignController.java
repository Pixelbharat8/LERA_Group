package com.lera.social_media_service.controller;

import com.lera.social_media_service.entity.MarketingCampaign;
import com.lera.social_media_service.repository.MarketingCampaignRepository;
import com.lera.social_media_service.service.JdbcAuditWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/marketing-campaigns")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','STAFF')")
public class MarketingCampaignController {
    
    private final MarketingCampaignRepository marketingCampaignRepository;
    private final JdbcAuditWriter auditWriter;

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
    
    @GetMapping
    public ResponseEntity<List<MarketingCampaign>> getAllCampaigns(Pageable pageable) {
        return ResponseEntity.ok(marketingCampaignRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<MarketingCampaign> getCampaignById(@PathVariable UUID id) {
        return marketingCampaignRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<MarketingCampaign>> getActiveCampaigns() {
        return ResponseEntity.ok(marketingCampaignRepository.findByStatus("ACTIVE"));
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<MarketingCampaign>> getCampaignsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(marketingCampaignRepository.findByStatus(status));
    }
    
    @GetMapping("/type/{type}")
    public ResponseEntity<List<MarketingCampaign>> getCampaignsByType(@PathVariable String type) {
        return ResponseEntity.ok(marketingCampaignRepository.findByCampaignType(type));
    }
    
    @PostMapping
    public ResponseEntity<MarketingCampaign> createCampaign(@Valid @RequestBody MarketingCampaign campaign) {
        campaign.setCreatedAt(LocalDateTime.now());
        campaign.setUpdatedAt(LocalDateTime.now());
        if (campaign.getStatus() == null) {
            campaign.setStatus("DRAFT");
        }
        MarketingCampaign saved = marketingCampaignRepository.save(campaign);
        auditWriter.log("MARKETING_CAMPAIGN_CREATED", "MarketingCampaign", saved.getId(), null, null,
                "{\"campaignName\":\"" + esc(saved.getCampaignName()) + "\",\"status\":\"" + esc(saved.getStatus()) + "\"}");
        return ResponseEntity.ok(saved);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<MarketingCampaign> updateCampaign(@PathVariable UUID id, @Valid @RequestBody MarketingCampaign details) {
        return marketingCampaignRepository.findById(id).map(campaign -> {
            String oldStatus = campaign.getStatus();
            if (details.getCampaignName() != null) campaign.setCampaignName(details.getCampaignName());
            if (details.getCampaignType() != null) campaign.setCampaignType(details.getCampaignType());
            if (details.getDescription() != null) campaign.setDescription(details.getDescription());
            if (details.getStartDate() != null) campaign.setStartDate(details.getStartDate());
            if (details.getEndDate() != null) campaign.setEndDate(details.getEndDate());
            if (details.getBudget() != null) campaign.setBudget(details.getBudget());
            if (details.getSpentAmount() != null) campaign.setSpentAmount(details.getSpentAmount());
            if (details.getTargetAudience() != null) campaign.setTargetAudience(details.getTargetAudience());
            if (details.getTargetPlatforms() != null) campaign.setTargetPlatforms(details.getTargetPlatforms());
            if (details.getStatus() != null) campaign.setStatus(details.getStatus());
            campaign.setUpdatedAt(LocalDateTime.now());
            MarketingCampaign saved = marketingCampaignRepository.save(campaign);
            auditWriter.log("MARKETING_CAMPAIGN_UPDATED", "MarketingCampaign", id, null,
                    "{\"status\":\"" + esc(oldStatus) + "\"}",
                    "{\"status\":\"" + esc(saved.getStatus()) + "\"}");
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<MarketingCampaign> updateCampaignStatus(@PathVariable UUID id, @Valid @RequestBody Map<String, String> body) {
        return marketingCampaignRepository.findById(id).map(campaign -> {
            String oldStatus = campaign.getStatus();
            String status = body.get("status");
            if (status != null) {
                campaign.setStatus(status);
            }
            campaign.setUpdatedAt(LocalDateTime.now());
            MarketingCampaign saved = marketingCampaignRepository.save(campaign);
            auditWriter.log("MARKETING_CAMPAIGN_STATUS_CHANGED", "MarketingCampaign", id, null,
                    "{\"status\":\"" + esc(oldStatus) + "\"}",
                    "{\"status\":\"" + esc(saved.getStatus()) + "\"}");
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/activate")
    public ResponseEntity<MarketingCampaign> activateCampaign(@PathVariable UUID id) {
        return marketingCampaignRepository.findById(id).map(campaign -> {
            String oldStatus = campaign.getStatus();
            campaign.setStatus("ACTIVE");
            campaign.setUpdatedAt(LocalDateTime.now());
            MarketingCampaign saved = marketingCampaignRepository.save(campaign);
            auditWriter.log("MARKETING_CAMPAIGN_STATUS_CHANGED", "MarketingCampaign", id, null,
                    "{\"status\":\"" + esc(oldStatus) + "\"}",
                    "{\"status\":\"ACTIVE\"}");
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/pause")
    public ResponseEntity<MarketingCampaign> pauseCampaign(@PathVariable UUID id) {
        return marketingCampaignRepository.findById(id).map(campaign -> {
            String oldStatus = campaign.getStatus();
            campaign.setStatus("PAUSED");
            campaign.setUpdatedAt(LocalDateTime.now());
            MarketingCampaign saved = marketingCampaignRepository.save(campaign);
            auditWriter.log("MARKETING_CAMPAIGN_STATUS_CHANGED", "MarketingCampaign", id, null,
                    "{\"status\":\"" + esc(oldStatus) + "\"}",
                    "{\"status\":\"PAUSED\"}");
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCampaign(@PathVariable UUID id) {
        Optional<MarketingCampaign> opt = marketingCampaignRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        MarketingCampaign campaign = opt.get();
        auditWriter.log("MARKETING_CAMPAIGN_DELETED", "MarketingCampaign", id, null,
                "{\"campaignName\":\"" + esc(campaign.getCampaignName()) + "\"}", null);
        marketingCampaignRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
