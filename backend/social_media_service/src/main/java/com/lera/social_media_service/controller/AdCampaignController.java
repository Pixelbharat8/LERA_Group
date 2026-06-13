package com.lera.social_media_service.controller;

import com.lera.social_media_service.entity.AdCampaign;
import com.lera.social_media_service.repository.AdCampaignRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/ad-campaigns")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','STAFF')")
public class AdCampaignController {
    
    private final AdCampaignRepository adCampaignRepository;
    
    @GetMapping
    public ResponseEntity<List<AdCampaign>> getAllCampaigns(Pageable pageable) {
        return ResponseEntity.ok(adCampaignRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<AdCampaign> getCampaignById(@PathVariable UUID id) {
        return adCampaignRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<AdCampaign>> getCampaignsByAccount(@PathVariable UUID accountId) {
        return ResponseEntity.ok(adCampaignRepository.findByAdAccountId(accountId));
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<AdCampaign>> getCampaignsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(adCampaignRepository.findByStatus(status));
    }
    
    @GetMapping("/account/{accountId}/status/{status}")
    public ResponseEntity<List<AdCampaign>> getCampaignsByAccountAndStatus(
            @PathVariable UUID accountId, @PathVariable String status) {
        return ResponseEntity.ok(adCampaignRepository.findByAdAccountIdAndStatus(accountId, status));
    }
    
    @GetMapping("/objective/{objective}")
    public ResponseEntity<List<AdCampaign>> getCampaignsByObjective(@PathVariable String objective) {
        return ResponseEntity.ok(adCampaignRepository.findByObjective(objective));
    }
    
    @PostMapping
    public ResponseEntity<AdCampaign> createCampaign(@Valid @RequestBody AdCampaign campaign) {
        campaign.setCreatedAt(LocalDateTime.now());
        campaign.setUpdatedAt(LocalDateTime.now());
        if (campaign.getStatus() == null) {
            campaign.setStatus("DRAFT");
        }
        return ResponseEntity.ok(adCampaignRepository.save(campaign));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<AdCampaign> updateCampaign(@PathVariable UUID id, @Valid @RequestBody AdCampaign details) {
        return adCampaignRepository.findById(id).map(campaign -> {
            if (details.getCampaignName() != null) campaign.setCampaignName(details.getCampaignName());
            if (details.getObjective() != null) campaign.setObjective(details.getObjective());
            if (details.getDailyBudget() != null) campaign.setDailyBudget(details.getDailyBudget());
            if (details.getLifetimeBudget() != null) campaign.setLifetimeBudget(details.getLifetimeBudget());
            if (details.getStartDate() != null) campaign.setStartDate(details.getStartDate());
            if (details.getEndDate() != null) campaign.setEndDate(details.getEndDate());
            if (details.getTargetLocations() != null) campaign.setTargetLocations(details.getTargetLocations());
            if (details.getTargetAgeMin() != null) campaign.setTargetAgeMin(details.getTargetAgeMin());
            if (details.getTargetAgeMax() != null) campaign.setTargetAgeMax(details.getTargetAgeMax());
            if (details.getTargetInterests() != null) campaign.setTargetInterests(details.getTargetInterests());
            if (details.getStatus() != null) campaign.setStatus(details.getStatus());
            campaign.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(adCampaignRepository.save(campaign));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<AdCampaign> updateCampaignStatus(@PathVariable UUID id, @Valid @RequestBody Map<String, String> body) {
        return adCampaignRepository.findById(id).map(campaign -> {
            String status = body.get("status");
            if (status != null) {
                campaign.setStatus(status);
            }
            campaign.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(adCampaignRepository.save(campaign));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/activate")
    public ResponseEntity<AdCampaign> activateCampaign(@PathVariable UUID id) {
        return adCampaignRepository.findById(id).map(campaign -> {
            campaign.setStatus("ACTIVE");
            campaign.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(adCampaignRepository.save(campaign));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/pause")
    public ResponseEntity<AdCampaign> pauseCampaign(@PathVariable UUID id) {
        return adCampaignRepository.findById(id).map(campaign -> {
            campaign.setStatus("PAUSED");
            campaign.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(adCampaignRepository.save(campaign));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCampaign(@PathVariable UUID id) {
        if (adCampaignRepository.existsById(id)) {
            adCampaignRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
