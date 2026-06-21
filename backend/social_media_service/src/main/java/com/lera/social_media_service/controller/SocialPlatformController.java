package com.lera.social_media_service.controller;

import com.lera.social_media_service.entity.SocialPlatform;
import com.lera.social_media_service.repository.SocialPlatformRepository;
import com.lera.social_media_service.security.AuthUser;
import com.lera.social_media_service.security.SocialMediaSecurity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/social-platforms")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','STAFF')")
public class SocialPlatformController {
    
    private final SocialPlatformRepository socialPlatformRepository;
    private final RestTemplate restTemplate;
    
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
    public ResponseEntity<SocialPlatform> createPlatform(
            @Valid @RequestBody SocialPlatform platform,
            @AuthenticationPrincipal AuthUser authUser) {
        SocialMediaSecurity.assertOrgWideMutate(authUser);
        platform.setCreatedAt(LocalDateTime.now());
        platform.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.ok(socialPlatformRepository.save(platform));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<SocialPlatform> updatePlatform(
            @PathVariable UUID id,
            @Valid @RequestBody SocialPlatform details,
            @AuthenticationPrincipal AuthUser authUser) {
        SocialMediaSecurity.assertOrgWideMutate(authUser);
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
    public ResponseEntity<SocialPlatform> connectPlatform(
            @PathVariable UUID id,
            @Valid @RequestBody Map<String, String> credentials,
            @AuthenticationPrincipal AuthUser authUser) {
        SocialMediaSecurity.assertOrgWideMutate(authUser);
        return socialPlatformRepository.findById(id).map(platform -> {
            platform.setIsConnected(true);
            platform.setAutoPost(true); // enable scheduled auto-posting once credentials are in place
            if (credentials.get("accessToken") != null) platform.setAccessToken(credentials.get("accessToken"));
            if (credentials.get("refreshToken") != null) platform.setRefreshToken(credentials.get("refreshToken"));
            if (credentials.get("pageId") != null) platform.setPageId(credentials.get("pageId"));
            platform.setLastSyncAt(LocalDateTime.now());
            return ResponseEntity.ok(socialPlatformRepository.save(platform));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/disconnect")
    public ResponseEntity<SocialPlatform> disconnectPlatform(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        SocialMediaSecurity.assertOrgWideMutate(authUser);
        return socialPlatformRepository.findById(id).map(platform -> {
            platform.setIsConnected(false);
            platform.setAccessToken(null);
            platform.setRefreshToken(null);
            return ResponseEntity.ok(socialPlatformRepository.save(platform));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Pull LIVE metrics from the provider. Implemented for Facebook/Instagram via the
     * Graph API: requires the platform to be connected first with a real Page ID + Page
     * Access Token (PUT /{id}/connect). Returns a clear 400 if not connected, and never
     * fabricates numbers — the follower count is whatever the Graph API returns.
     */
    @PutMapping("/{id}/sync")
    public ResponseEntity<SocialPlatform> syncPlatform(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        SocialMediaSecurity.assertOrgWideMutate(authUser);
        SocialPlatform platform = socialPlatformRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Platform not found"));

        String name = platform.getPlatformName() == null ? "" : platform.getPlatformName().toLowerCase();
        if (!name.equals("facebook") && !name.equals("instagram")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Live sync is implemented for Facebook/Instagram (Meta Graph API). "
                            + platform.getPlatformName() + " needs its own provider integration.");
        }
        if (isBlank(platform.getAccessToken()) || isBlank(platform.getPageId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Connect " + platform.getPlatformName() + " first with a valid Page ID and Page Access Token, then sync.");
        }

        try {
            String url = String.format(
                    "https://graph.facebook.com/v19.0/%s?fields=fan_count,followers_count,name&access_token=%s",
                    platform.getPageId(), platform.getAccessToken());
            @SuppressWarnings("unchecked")
            Map<String, Object> resp = restTemplate.getForObject(url, Map.class);
            if (resp == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Empty response from the Graph API");
            }
            Object followers = resp.get("followers_count");
            if (followers == null) followers = resp.get("fan_count");
            if (followers == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Graph API returned no follower count — check the token scopes (pages_read_engagement / read_insights).");
            }
            int now = ((Number) followers).intValue();
            int prev = platform.getFollowerCount() == null ? 0 : platform.getFollowerCount();
            if (prev > 0) {
                // Real growth vs the last synced value (rounded to 0.1%).
                platform.setGrowthRate(Math.round((now - prev) * 1000.0 / prev) / 10.0);
            }
            platform.setFollowerCount(now);
            platform.setLastSyncAt(LocalDateTime.now());
            log.info("Synced {} from Graph API: {} followers", name, now);
            return ResponseEntity.ok(socialPlatformRepository.save(platform));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Graph API sync failed for platform {}", id, e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Graph API call failed: " + e.getMessage());
        }
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlatform(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        SocialMediaSecurity.assertOrgWideMutate(authUser);
        if (socialPlatformRepository.existsById(id)) {
            socialPlatformRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
