package com.lera.social_media_service.controller;

import com.lera.social_media_service.entity.SocialMediaPost;
import com.lera.social_media_service.repository.SocialMediaPostRepository;
import com.lera.social_media_service.security.AuthUser;
import com.lera.social_media_service.security.SocialMediaSecurity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/api/social-media-posts")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','STAFF')")
public class SocialMediaPostController {

    private final SocialMediaPostRepository socialMediaPostRepository;

    @GetMapping
    public ResponseEntity<List<SocialMediaPost>> getAllPosts(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String platform,
            @RequestParam(required = false) Integer limit) {

        List<SocialMediaPost> posts = status != null
                ? socialMediaPostRepository.findByStatus(status.toLowerCase())
                : socialMediaPostRepository.findAllOrderByCreatedAtDesc();

        if (platform != null && !platform.isEmpty()) {
            final String platformLower = platform.toLowerCase();
            posts = posts.stream()
                    .filter(p -> p.getPlatforms() != null
                            && Arrays.stream(p.getPlatforms())
                            .anyMatch(plat -> plat.toLowerCase().contains(platformLower)))
                    .toList();
        }

        if (limit != null && limit > 0 && posts.size() > limit) {
            posts = posts.subList(0, limit);
        }

        return ResponseEntity.ok(posts);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getPostStats(Pageable pageable) {
        List<SocialMediaPost> allPosts = socialMediaPostRepository.findAll(pageable).getContent();

        int totalReach = allPosts.stream().mapToInt(p -> p.getReach() != null ? p.getReach() : 0).sum();
        int totalLikes = allPosts.stream().mapToInt(p -> p.getLikes() != null ? p.getLikes() : 0).sum();
        int totalShares = allPosts.stream().mapToInt(p -> p.getShares() != null ? p.getShares() : 0).sum();
        int totalComments = allPosts.stream().mapToInt(p -> p.getComments() != null ? p.getComments() : 0).sum();
        double engagementRate = totalReach > 0
                ? ((double) (totalLikes + totalComments + totalShares) / totalReach) * 100 : 0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPosts", allPosts.size());
        stats.put("scheduled", allPosts.stream().filter(p -> "scheduled".equals(p.getStatus())).count());
        stats.put("published", allPosts.stream().filter(p -> "published".equals(p.getStatus())).count());
        stats.put("drafts", allPosts.stream().filter(p -> "draft".equals(p.getStatus())).count());
        stats.put("pendingApproval", allPosts.stream().filter(p -> "pending_approval".equals(p.getStatus())).count());
        stats.put("totalReach", totalReach);
        stats.put("totalImpressions", allPosts.stream().mapToInt(p -> p.getImpressions() != null ? p.getImpressions() : 0).sum());
        stats.put("totalLikes", totalLikes);
        stats.put("totalShares", totalShares);
        stats.put("totalComments", totalComments);
        stats.put("totalClicks", allPosts.stream().mapToInt(p -> p.getClicks() != null ? p.getClicks() : 0).sum());
        stats.put("engagementRate", Math.round(engagementRate * 100.0) / 100.0);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SocialMediaPost> getPostById(@PathVariable UUID id) {
        return socialMediaPostRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<SocialMediaPost>> getPostsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(socialMediaPostRepository.findByStatus(status));
    }

    @GetMapping("/scheduled")
    public ResponseEntity<List<SocialMediaPost>> getScheduledPosts() {
        return ResponseEntity.ok(socialMediaPostRepository.findByStatusOrderByScheduledAtDesc("scheduled"));
    }

    @GetMapping("/published")
    public ResponseEntity<List<SocialMediaPost>> getPublishedPosts() {
        return ResponseEntity.ok(socialMediaPostRepository.findByStatusOrderByScheduledAtDesc("published"));
    }

    @GetMapping("/campaign/{campaignId}")
    public ResponseEntity<List<SocialMediaPost>> getPostsByCampaign(@PathVariable UUID campaignId) {
        return ResponseEntity.ok(socialMediaPostRepository.findByCampaignId(campaignId));
    }

    @GetMapping("/calendar")
    public ResponseEntity<List<SocialMediaPost>> getPostsForCalendar(
            @RequestParam String start,
            @RequestParam String end) {
        LocalDateTime startDate = LocalDateTime.parse(start);
        LocalDateTime endDate = LocalDateTime.parse(end);
        return ResponseEntity.ok(socialMediaPostRepository.findByScheduledAtBetween(startDate, endDate));
    }

    @PostMapping
    public ResponseEntity<SocialMediaPost> createPost(
            @Valid @RequestBody SocialMediaPost post,
            @AuthenticationPrincipal AuthUser authUser) {
        SocialMediaSecurity.assertOrgWideMutate(authUser);
        UUID self = SocialMediaSecurity.requireUserId(authUser);
        if (post.getCreatedBy() == null) {
            post.setCreatedBy(self);
        }
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());
        if (post.getStatus() == null) {
            post.setStatus("draft");
        }
        return ResponseEntity.ok(socialMediaPostRepository.save(post));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SocialMediaPost> updatePost(
            @PathVariable UUID id,
            @Valid @RequestBody SocialMediaPost details,
            @AuthenticationPrincipal AuthUser authUser) {
        SocialMediaSecurity.assertOrgWideMutate(authUser);
        return socialMediaPostRepository.findById(id).map(post -> {
            if (details.getTitle() != null) post.setTitle(details.getTitle());
            if (details.getContent() != null) post.setContent(details.getContent());
            if (details.getContentType() != null) post.setContentType(details.getContentType());
            if (details.getMediaUrls() != null) post.setMediaUrls(details.getMediaUrls());
            if (details.getPlatforms() != null) post.setPlatforms(details.getPlatforms());
            if (details.getHashtags() != null) post.setHashtags(details.getHashtags());
            if (details.getLinkUrl() != null) post.setLinkUrl(details.getLinkUrl());
            if (details.getScheduledAt() != null) post.setScheduledAt(details.getScheduledAt());
            if (details.getStatus() != null) post.setStatus(details.getStatus());
            if (details.getCampaignId() != null) post.setCampaignId(details.getCampaignId());
            post.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(socialMediaPostRepository.save(post));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/schedule")
    public ResponseEntity<SocialMediaPost> schedulePost(
            @PathVariable UUID id,
            @Valid @RequestBody Map<String, String> body,
            @AuthenticationPrincipal AuthUser authUser) {
        SocialMediaSecurity.assertOrgWideMutate(authUser);
        return socialMediaPostRepository.findById(id).map(post -> {
            if (body.get("scheduledAt") != null) {
                post.setScheduledAt(LocalDateTime.parse(body.get("scheduledAt")));
            }
            post.setStatus("scheduled");
            post.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(socialMediaPostRepository.save(post));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/publish")
    public ResponseEntity<SocialMediaPost> publishPost(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        SocialMediaSecurity.assertOrgWideMutate(authUser);
        return socialMediaPostRepository.findById(id).map(post -> {
            log.info(
                    "Post id={} marked published in LERA; external network publish is not implemented.",
                    id);
            post.setStatus("published");
            post.setPublishedAt(LocalDateTime.now());
            post.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(socialMediaPostRepository.save(post));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<SocialMediaPost> approvePost(
            @PathVariable UUID id,
            @Valid @RequestBody Map<String, String> body,
            @AuthenticationPrincipal AuthUser authUser) {
        SocialMediaSecurity.assertOrgWideMutate(authUser);
        return socialMediaPostRepository.findById(id).map(post -> {
            if (body.get("approvedBy") != null) {
                post.setApprovedBy(UUID.fromString(body.get("approvedBy")));
            } else {
                post.setApprovedBy(SocialMediaSecurity.requireUserId(authUser));
            }
            post.setApprovedAt(LocalDateTime.now());
            post.setStatus("scheduled");
            post.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(socialMediaPostRepository.save(post));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        SocialMediaSecurity.assertOrgWideMutate(authUser);
        if (socialMediaPostRepository.existsById(id)) {
            socialMediaPostRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
