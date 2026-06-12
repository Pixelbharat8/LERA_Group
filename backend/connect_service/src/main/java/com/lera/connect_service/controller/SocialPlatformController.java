package com.lera.connect_service.controller;

import com.lera.connect_service.entity.SocialPlatform;
import com.lera.connect_service.repository.SocialPlatformRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
// DEPRECATED 2026-05: canonical implementation lives in social_media_service.
// The gateway routes /api/social-platforms there. This duplicate is parked
// under /api/_deprecated/... so it still compiles but does not collide.
@RequestMapping("/api/_deprecated/social-platforms")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
public class SocialPlatformController {
    
    private final SocialPlatformRepository socialPlatformRepository;
    
    @GetMapping
    public ResponseEntity<List<SocialPlatform>> getAllPlatforms(Pageable pageable) {
        return ResponseEntity.ok(socialPlatformRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<SocialPlatform>> getActivePlatforms() {
        return ResponseEntity.ok(socialPlatformRepository.findByIsActiveTrueOrderByPlatformName());
    }
    
    @GetMapping("/connected")
    public ResponseEntity<List<SocialPlatform>> getConnectedPlatforms() {
        return ResponseEntity.ok(socialPlatformRepository.findByIsConnectedTrue());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SocialPlatform> getPlatformById(@PathVariable UUID id) {
        return socialPlatformRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/name/{name}")
    public ResponseEntity<SocialPlatform> getPlatformByName(@PathVariable String name) {
        return socialPlatformRepository.findByPlatformName(name)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<SocialPlatform> createPlatform(@Valid @RequestBody SocialPlatform platform) {
        return ResponseEntity.ok(socialPlatformRepository.save(platform));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<SocialPlatform> updatePlatform(@PathVariable UUID id, @Valid @RequestBody SocialPlatform details) {
        return socialPlatformRepository.findById(id).map(platform -> {
            if (details.getDisplayName() != null) platform.setDisplayName(details.getDisplayName());
            if (details.getIcon() != null) platform.setIcon(details.getIcon());
            if (details.getColor() != null) platform.setColor(details.getColor());
            if (details.getPageUrl() != null) platform.setPageUrl(details.getPageUrl());
            if (details.getPageId() != null) platform.setPageId(details.getPageId());
            if (details.getIsActive() != null) platform.setIsActive(details.getIsActive());
            if (details.getIsConnected() != null) platform.setIsConnected(details.getIsConnected());
            if (details.getAutoPost() != null) platform.setAutoPost(details.getAutoPost());
            if (details.getApiKey() != null) platform.setApiKey(details.getApiKey());
            if (details.getApiSecret() != null) platform.setApiSecret(details.getApiSecret());
            if (details.getAccessToken() != null) platform.setAccessToken(details.getAccessToken());
            if (details.getRefreshToken() != null) platform.setRefreshToken(details.getRefreshToken());
            return ResponseEntity.ok(socialPlatformRepository.save(platform));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/connect")
    public ResponseEntity<SocialPlatform> connectPlatform(@PathVariable UUID id, @Valid @RequestBody SocialPlatform details) {
        return socialPlatformRepository.findById(id).map(platform -> {
            platform.setIsConnected(true);
            if (details.getAccessToken() != null) platform.setAccessToken(details.getAccessToken());
            if (details.getRefreshToken() != null) platform.setRefreshToken(details.getRefreshToken());
            if (details.getTokenExpiresAt() != null) platform.setTokenExpiresAt(details.getTokenExpiresAt());
            if (details.getPageId() != null) platform.setPageId(details.getPageId());
            if (details.getPageUrl() != null) platform.setPageUrl(details.getPageUrl());
            return ResponseEntity.ok(socialPlatformRepository.save(platform));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/disconnect")
    public ResponseEntity<SocialPlatform> disconnectPlatform(@PathVariable UUID id) {
        return socialPlatformRepository.findById(id).map(platform -> {
            platform.setIsConnected(false);
            platform.setAccessToken(null);
            platform.setRefreshToken(null);
            platform.setTokenExpiresAt(null);
            return ResponseEntity.ok(socialPlatformRepository.save(platform));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlatform(@PathVariable UUID id) {
        if (socialPlatformRepository.existsById(id)) {
            socialPlatformRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Get total follower count across all platforms
     * Frontend calls: GET /api/social-platforms/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<java.util.Map<String, Object>> getPlatformStats() {
        java.util.List<SocialPlatform> platforms = socialPlatformRepository.findByIsActiveTrueOrderByPlatformName();
        
        int totalFollowers = platforms.stream()
                .mapToInt(p -> p.getFollowerCount() != null ? p.getFollowerCount() : 0)
                .sum();
        
        double avgGrowthRate = platforms.stream()
                .filter(p -> p.getGrowthRate() != null)
                .mapToDouble(SocialPlatform::getGrowthRate)
                .average()
                .orElse(0.0);
        
        int connectedPlatforms = (int) platforms.stream().filter(p -> Boolean.TRUE.equals(p.getIsConnected())).count();
        
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalFollowers", totalFollowers);
        stats.put("avgGrowthRate", Math.round(avgGrowthRate * 10.0) / 10.0);
        stats.put("activePlatforms", platforms.size());
        stats.put("connectedPlatforms", connectedPlatforms);
        
        return ResponseEntity.ok(stats);
    }
}
