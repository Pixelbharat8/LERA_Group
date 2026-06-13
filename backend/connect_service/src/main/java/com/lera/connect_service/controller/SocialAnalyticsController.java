package com.lera.connect_service.controller;

import com.lera.connect_service.entity.SocialAnalytics;
import com.lera.connect_service.repository.SocialAnalyticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
// DEPRECATED 2026-05: canonical implementation lives in social_media_service.
@RequestMapping("/api/_deprecated/social-analytics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
public class SocialAnalyticsController {
    
    private final SocialAnalyticsRepository socialAnalyticsRepository;
    
    @GetMapping
    public ResponseEntity<List<SocialAnalytics>> getAllAnalytics(Pageable pageable) {
        return ResponseEntity.ok(socialAnalyticsRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/latest")
    public ResponseEntity<List<SocialAnalytics>> getLatestAnalytics() {
        return ResponseEntity.ok(socialAnalyticsRepository.findLatestByPlatform());
    }
    
    @GetMapping("/platform/{platform}")
    public ResponseEntity<List<SocialAnalytics>> getByPlatform(@PathVariable String platform) {
        return ResponseEntity.ok(socialAnalyticsRepository.findByPlatformOrderByMetricDateDesc(platform));
    }
    
    @GetMapping("/range")
    public ResponseEntity<List<SocialAnalytics>> getByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        return ResponseEntity.ok(socialAnalyticsRepository.findByDateRange(start, end));
    }
    
    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getOverview() {
        List<SocialAnalytics> latestData = socialAnalyticsRepository.findLatestByPlatform();
        
        Map<String, Object> overview = new HashMap<>();
        
        int totalFollowers = latestData.stream().mapToInt(SocialAnalytics::getFollowers).sum();
        int totalEngagement = latestData.stream().mapToInt(SocialAnalytics::getTotalEngagement).sum();
        int totalReach = latestData.stream().mapToInt(SocialAnalytics::getTotalReach).sum();
        int totalPosts = latestData.stream().mapToInt(SocialAnalytics::getPostsCount).sum();
        
        overview.put("totalFollowers", totalFollowers);
        overview.put("totalEngagement", totalEngagement);
        overview.put("totalReach", totalReach);
        overview.put("totalPosts", totalPosts);
        overview.put("platformData", latestData);
        
        return ResponseEntity.ok(overview);
    }
    
    @PostMapping
    public ResponseEntity<SocialAnalytics> createAnalytics(@Valid @RequestBody SocialAnalytics analytics) {
        return ResponseEntity.ok(socialAnalyticsRepository.save(analytics));
    }
    
    @PostMapping("/bulk")
    public ResponseEntity<List<SocialAnalytics>> createBulkAnalytics(@Valid @RequestBody List<SocialAnalytics> analyticsLst) {
        return ResponseEntity.ok(socialAnalyticsRepository.saveAll(analyticsLst));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<SocialAnalytics> updateAnalytics(@PathVariable UUID id, @Valid @RequestBody SocialAnalytics details) {
        return socialAnalyticsRepository.findById(id).map(analytics -> {
            if (details.getFollowers() != null) analytics.setFollowers(details.getFollowers());
            if (details.getTotalReach() != null) analytics.setTotalReach(details.getTotalReach());
            if (details.getTotalEngagement() != null) analytics.setTotalEngagement(details.getTotalEngagement());
            if (details.getTotalImpressions() != null) analytics.setTotalImpressions(details.getTotalImpressions());
            if (details.getEngagementRate() != null) analytics.setEngagementRate(details.getEngagementRate());
            if (details.getPostsCount() != null) analytics.setPostsCount(details.getPostsCount());
            return ResponseEntity.ok(socialAnalyticsRepository.save(analytics));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnalytics(@PathVariable UUID id) {
        if (socialAnalyticsRepository.existsById(id)) {
            socialAnalyticsRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
