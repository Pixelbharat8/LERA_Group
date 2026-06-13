package com.lera.social_media_service.controller;

import com.lera.social_media_service.entity.SocialAnalytics;
import com.lera.social_media_service.repository.SocialAnalyticsRepository;
import com.lera.social_media_service.security.AuthUser;
import com.lera.social_media_service.security.SocialMediaSecurity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/social-analytics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','STAFF')")
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
        int totalImpressions = latestData.stream().mapToInt(SocialAnalytics::getTotalImpressions).sum();
        
        overview.put("totalFollowers", totalFollowers);
        overview.put("totalEngagement", totalEngagement);
        overview.put("totalReach", totalReach);
        overview.put("totalPosts", totalPosts);
        overview.put("totalImpressions", totalImpressions);
        overview.put("platformData", latestData);
        
        return ResponseEntity.ok(overview);
    }
    
    @GetMapping("/platform/{platform}/range")
    public ResponseEntity<List<SocialAnalytics>> getByPlatformAndDateRange(
            @PathVariable String platform,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        return ResponseEntity.ok(socialAnalyticsRepository.findByPlatformAndDateRange(platform, start, end));
    }
    
    @PostMapping
    public ResponseEntity<SocialAnalytics> createAnalytics(
            @Valid @RequestBody SocialAnalytics analytics,
            @AuthenticationPrincipal AuthUser authUser) {
        SocialMediaSecurity.assertOrgWideMutate(authUser);
        analytics.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.ok(socialAnalyticsRepository.save(analytics));
    }
    
    @PostMapping("/bulk")
    public ResponseEntity<List<SocialAnalytics>> createBulkAnalytics(
            @Valid @RequestBody List<SocialAnalytics> analyticsList,
            @AuthenticationPrincipal AuthUser authUser) {
        SocialMediaSecurity.assertOrgWideMutate(authUser);
        analyticsList.forEach(a -> a.setCreatedAt(LocalDateTime.now()));
        return ResponseEntity.ok(socialAnalyticsRepository.saveAll(analyticsList));
    }
    
    @PostMapping("/sync/{platform}")
    public ResponseEntity<Map<String, Object>> syncPlatformAnalytics(@PathVariable String platform) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(Map.of(
                "success", false,
                "error", "NOT_IMPLEMENTED",
                "platform", platform,
                "message", "External analytics sync is not implemented; add provider credentials and a client adapter when ready."
        ));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnalytics(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        SocialMediaSecurity.assertOrgWideMutate(authUser);
        if (socialAnalyticsRepository.existsById(id)) {
            socialAnalyticsRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
