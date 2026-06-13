package com.lera.connect_service.controller;

import com.lera.connect_service.entity.MarketingCampaign;
import com.lera.connect_service.repository.MarketingCampaignRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
// DEPRECATED 2026-05: canonical implementation lives in social_media_service.
@RequestMapping("/api/_deprecated/marketing-campaigns")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
public class MarketingCampaignController {
    
    private final MarketingCampaignRepository marketingCampaignRepository;
    
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
    
    @GetMapping("/type/{type}")
    public ResponseEntity<List<MarketingCampaign>> getCampaignsByType(@PathVariable String type) {
        return ResponseEntity.ok(marketingCampaignRepository.findByCampaignType(type));
    }
    
    @PostMapping
    public ResponseEntity<MarketingCampaign> createCampaign(@Valid @RequestBody MarketingCampaign campaign) {
        return ResponseEntity.ok(marketingCampaignRepository.save(campaign));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<MarketingCampaign> updateCampaign(@PathVariable UUID id, @Valid @RequestBody MarketingCampaign details) {
        return marketingCampaignRepository.findById(id).map(campaign -> {
            if (details.getCampaignName() != null) campaign.setCampaignName(details.getCampaignName());
            if (details.getCampaignType() != null) campaign.setCampaignType(details.getCampaignType());
            if (details.getDescription() != null) campaign.setDescription(details.getDescription());
            if (details.getStartDate() != null) campaign.setStartDate(details.getStartDate());
            if (details.getEndDate() != null) campaign.setEndDate(details.getEndDate());
            if (details.getBudget() != null) campaign.setBudget(details.getBudget());
            if (details.getStatus() != null) campaign.setStatus(details.getStatus());
            return ResponseEntity.ok(marketingCampaignRepository.save(campaign));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCampaign(@PathVariable UUID id) {
        if (marketingCampaignRepository.existsById(id)) {
            marketingCampaignRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Update campaign status
     * Frontend calls: PUT /api/marketing-campaigns/{id}/status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<MarketingCampaign> updateCampaignStatus(@PathVariable UUID id, @Valid @RequestBody Map<String, String> body) {
        return marketingCampaignRepository.findById(id).map(campaign -> {
            String status = body.get("status");
            if (status != null) {
                campaign.setStatus(status);
            }
            return ResponseEntity.ok(marketingCampaignRepository.save(campaign));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get campaign statistics
     * Frontend calls: GET /api/marketing-campaigns/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getCampaignStats(Pageable pageable) {
        List<MarketingCampaign> campaigns = marketingCampaignRepository.findAll(pageable).getContent();
        
        Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalCampaigns", campaigns.size());
        stats.put("activeCampaigns", campaigns.stream().filter(c -> "ACTIVE".equals(c.getStatus())).count());
        stats.put("scheduledCampaigns", campaigns.stream().filter(c -> "SCHEDULED".equals(c.getStatus())).count());
        stats.put("completedCampaigns", campaigns.stream().filter(c -> "COMPLETED".equals(c.getStatus())).count());
        
        // Budget stats
        double totalBudget = campaigns.stream()
                .mapToDouble(c -> c.getBudget() != null ? c.getBudget().doubleValue() : 0)
                .sum();
        double totalSpent = campaigns.stream()
                .mapToDouble(c -> c.getSpentAmount() != null ? c.getSpentAmount().doubleValue() : 0)
                .sum();
        
        stats.put("totalBudget", totalBudget);
        stats.put("totalSpent", totalSpent);
        stats.put("budgetUtilization", totalBudget > 0 ? (totalSpent / totalBudget * 100) : 0);
        
        return ResponseEntity.ok(stats);
    }
}
