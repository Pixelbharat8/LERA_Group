package com.lera.connect_service.controller;

import com.lera.connect_service.entity.SocialMediaPost;
import com.lera.connect_service.repository.SocialMediaPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.HashMap;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
// DEPRECATED 2026-05: canonical implementation lives in social_media_service.
@RequestMapping("/api/_deprecated/social-media-posts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
public class SocialMediaPostController {
    
    private final SocialMediaPostRepository socialMediaPostRepository;
    
    /**
     * Get all posts with optional filtering by status, platform, and limit
     * Frontend calls: GET /api/social-media-posts?status=SCHEDULED&limit=4&platform=facebook
     */
    @GetMapping
    public ResponseEntity<List<SocialMediaPost>> getAllPosts(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String platform,
            @RequestParam(required = false) Integer limit) {
        
        List<SocialMediaPost> posts;
        if (status != null) {
            posts = socialMediaPostRepository.findByStatus(status.toLowerCase());
        } else {
            posts = socialMediaPostRepository.findAllOrderByCreatedAtDesc();
        }
        
        // Filter by platform if specified
        if (platform != null && !platform.isEmpty()) {
            final String platformLower = platform.toLowerCase();
            posts = posts.stream()
                    .filter(p -> p.getPlatforms() != null && 
                            java.util.Arrays.stream(p.getPlatforms())
                                    .anyMatch(plat -> plat.toLowerCase().contains(platformLower)))
                    .toList();
        }
        
        if (limit != null && limit > 0 && posts.size() > limit) {
            posts = posts.subList(0, limit);
        }
        
        return ResponseEntity.ok(posts);
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

    @GetMapping("/pending-approval")
    public ResponseEntity<List<SocialMediaPost>> getPendingApprovalPosts() {
        return ResponseEntity.ok(socialMediaPostRepository.findByStatusOrderByScheduledAtDesc("pending_approval"));
    }

    @GetMapping("/drafts")
    public ResponseEntity<List<SocialMediaPost>> getDraftPosts() {
        return ResponseEntity.ok(socialMediaPostRepository.findByStatusOrderByScheduledAtDesc("draft"));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SocialMediaPost>> getPostsByUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(socialMediaPostRepository.findByCreatedBy(userId));
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
    public ResponseEntity<SocialMediaPost> createPost(@Valid @RequestBody SocialMediaPost post) {
        if (post.getCreatedAt() == null) {
            post.setCreatedAt(LocalDateTime.now());
        }
        post.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.ok(socialMediaPostRepository.save(post));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<SocialMediaPost> updatePost(@PathVariable UUID id, @Valid @RequestBody SocialMediaPost details) {
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
            post.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(socialMediaPostRepository.save(post));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/approve")
    public ResponseEntity<SocialMediaPost> approvePost(@PathVariable UUID id, @Valid @RequestBody Map<String, UUID> body) {
        UUID approvedBy = body.get("approvedBy");
        return socialMediaPostRepository.findById(id).map(post -> {
            post.setApprovedBy(approvedBy);
            post.setApprovedAt(LocalDateTime.now());
            post.setStatus("approved");
            post.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(socialMediaPostRepository.save(post));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<SocialMediaPost> rejectPost(@PathVariable UUID id, @Valid @RequestBody Map<String, Object> body) {
        String rejectedById = body.get("rejectedBy") != null ? body.get("rejectedBy").toString() : null;
        String reason = body.get("reason") != null ? body.get("reason").toString() : null;
        return socialMediaPostRepository.findById(id).map(post -> {
            post.setStatus("rejected");
            post.setUpdatedAt(LocalDateTime.now());
            // Store rejection info in engagement data
            StringBuilder jsonBuilder = new StringBuilder("{");
            if (reason != null) {
                jsonBuilder.append("\"rejectionReason\": \"").append(reason).append("\"");
            }
            if (rejectedById != null) {
                if (reason != null) jsonBuilder.append(", ");
                jsonBuilder.append("\"rejectedBy\": \"").append(rejectedById).append("\"");
                jsonBuilder.append(", \"rejectedAt\": \"").append(LocalDateTime.now()).append("\"");
            }
            jsonBuilder.append("}");
            post.setEngagementData(jsonBuilder.toString());
            return ResponseEntity.ok(socialMediaPostRepository.save(post));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/submit-for-approval")
    public ResponseEntity<SocialMediaPost> submitForApproval(@PathVariable UUID id) {
        return socialMediaPostRepository.findById(id).map(post -> {
            post.setStatus("pending_approval");
            post.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(socialMediaPostRepository.save(post));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/publish")
    public ResponseEntity<SocialMediaPost> publishPost(@PathVariable UUID id) {
        return socialMediaPostRepository.findById(id).map(post -> {
            post.setPublishedAt(LocalDateTime.now());
            post.setStatus("published");
            post.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(socialMediaPostRepository.save(post));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable UUID id) {
        if (socialMediaPostRepository.existsById(id)) {
            socialMediaPostRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getPostStats(Pageable pageable) {
        List<SocialMediaPost> allPosts = socialMediaPostRepository.findAll(pageable).getContent();
        
        int totalPosts = allPosts.size();
        int scheduled = (int) allPosts.stream().filter(p -> "scheduled".equals(p.getStatus())).count();
        int published = (int) allPosts.stream().filter(p -> "published".equals(p.getStatus())).count();
        int drafts = (int) allPosts.stream().filter(p -> "draft".equals(p.getStatus())).count();
        int pendingApproval = (int) allPosts.stream().filter(p -> "pending_approval".equals(p.getStatus())).count();
        int approved = (int) allPosts.stream().filter(p -> "approved".equals(p.getStatus())).count();
        int rejected = (int) allPosts.stream().filter(p -> "rejected".equals(p.getStatus())).count();
        int failed = (int) allPosts.stream().filter(p -> "failed".equals(p.getStatus())).count();
        
        int totalReach = allPosts.stream().mapToInt(p -> p.getReach() != null ? p.getReach() : 0).sum();
        int totalImpressions = allPosts.stream().mapToInt(p -> p.getImpressions() != null ? p.getImpressions() : 0).sum();
        int totalLikes = allPosts.stream().mapToInt(p -> p.getLikes() != null ? p.getLikes() : 0).sum();
        int totalShares = allPosts.stream().mapToInt(p -> p.getShares() != null ? p.getShares() : 0).sum();
        int totalComments = allPosts.stream().mapToInt(p -> p.getComments() != null ? p.getComments() : 0).sum();
        int totalClicks = allPosts.stream().mapToInt(p -> p.getClicks() != null ? p.getClicks() : 0).sum();
        
        // Calculate engagement rate
        double engagementRate = totalReach > 0 ? 
                ((double)(totalLikes + totalComments + totalShares) / totalReach) * 100 : 0;
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPosts", totalPosts);
        stats.put("scheduled", scheduled);
        stats.put("published", published);
        stats.put("drafts", drafts);
        stats.put("pendingApproval", pendingApproval);
        stats.put("approved", approved);
        stats.put("rejected", rejected);
        stats.put("failed", failed);
        stats.put("totalReach", totalReach);
        stats.put("totalImpressions", totalImpressions);
        stats.put("totalLikes", totalLikes);
        stats.put("totalShares", totalShares);
        stats.put("totalComments", totalComments);
        stats.put("totalClicks", totalClicks);
        stats.put("engagementRate", Math.round(engagementRate * 100.0) / 100.0);
        
        return ResponseEntity.ok(stats);
    }

    /**
     * Get top performing posts by engagement
     * Frontend calls: GET /api/social-media-posts/top?limit=5
     */
    @GetMapping("/top")
    public ResponseEntity<List<SocialMediaPost>> getTopPosts(@RequestParam(defaultValue = "5") int limit, Pageable pageable) {
        List<SocialMediaPost> allPosts = socialMediaPostRepository.findAll(pageable).getContent();
        
        // Sort by total engagement (likes + shares + comments)
        List<SocialMediaPost> topPosts = allPosts.stream()
                .filter(p -> "published".equalsIgnoreCase(p.getStatus()))
                .sorted((a, b) -> {
                    int engagementA = (a.getLikes() != null ? a.getLikes() : 0) 
                            + (a.getShares() != null ? a.getShares() : 0) 
                            + (a.getComments() != null ? a.getComments() : 0);
                    int engagementB = (b.getLikes() != null ? b.getLikes() : 0) 
                            + (b.getShares() != null ? b.getShares() : 0) 
                            + (b.getComments() != null ? b.getComments() : 0);
                    return Integer.compare(engagementB, engagementA);
                })
                .limit(limit)
                .toList();
        
        return ResponseEntity.ok(topPosts);
    }

    /**
     * Get posts by platform
     * Frontend calls: GET /api/social-media-posts/platform/facebook
     */
    @GetMapping("/platform/{platform}")
    public ResponseEntity<List<SocialMediaPost>> getPostsByPlatform(@PathVariable String platform) {
        List<SocialMediaPost> allPosts = socialMediaPostRepository.findAllOrderByCreatedAtDesc();
        
        List<SocialMediaPost> platformPosts = allPosts.stream()
                .filter(p -> p.getPlatforms() != null && 
                        java.util.Arrays.stream(p.getPlatforms())
                                .anyMatch(plat -> plat.toLowerCase().contains(platform.toLowerCase())))
                .toList();
        
        return ResponseEntity.ok(platformPosts);
    }

    /**
     * Duplicate a post (for reposting/recycling content)
     */
    @PostMapping("/{id}/duplicate")
    public ResponseEntity<SocialMediaPost> duplicatePost(@PathVariable UUID id) {
        return socialMediaPostRepository.findById(id).map(original -> {
            SocialMediaPost duplicate = SocialMediaPost.builder()
                    .title(original.getTitle() + " (Copy)")
                    .content(original.getContent())
                    .contentType(original.getContentType())
                    .mediaUrls(original.getMediaUrls())
                    .platforms(original.getPlatforms())
                    .hashtags(original.getHashtags())
                    .linkUrl(original.getLinkUrl())
                    .status("draft")
                    .createdBy(original.getCreatedBy())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            return ResponseEntity.ok(socialMediaPostRepository.save(duplicate));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Bulk update status (e.g., publish multiple posts at once)
     */
    @PutMapping("/bulk-status")
    public ResponseEntity<Map<String, Object>> bulkUpdateStatus(@Valid @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.get("ids");
        String status = (String) body.get("status");
        
        if (ids == null || status == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "ids and status are required"));
        }
        
        int updated = 0;
        for (String idStr : ids) {
            UUID id = UUID.fromString(idStr);
            var postOpt = socialMediaPostRepository.findById(id);
            if (postOpt.isPresent()) {
                SocialMediaPost post = postOpt.get();
                post.setStatus(status.toLowerCase());
                post.setUpdatedAt(LocalDateTime.now());
                if ("published".equalsIgnoreCase(status)) {
                    post.setPublishedAt(LocalDateTime.now());
                }
                socialMediaPostRepository.save(post);
                updated++;
            }
        }
        
        return ResponseEntity.ok(Map.of("updated", updated, "total", ids.size()));
    }

    /**
     * Get post count by date range (for analytics)
     */
    @GetMapping("/analytics/count-by-date")
    public ResponseEntity<Map<String, Object>> getPostCountByDate(
            @RequestParam String start,
            @RequestParam String end) {
        LocalDateTime startDate = LocalDateTime.parse(start);
        LocalDateTime endDate = LocalDateTime.parse(end);
        
        List<SocialMediaPost> posts = socialMediaPostRepository.findByScheduledAtBetween(startDate, endDate);
        
        Map<String, Long> countByStatus = posts.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        p -> p.getStatus() != null ? p.getStatus() : "unknown",
                        java.util.stream.Collectors.counting()
                ));
        
        Map<String, Object> result = new HashMap<>();
        result.put("totalInRange", posts.size());
        result.put("countByStatus", countByStatus);
        result.put("startDate", start);
        result.put("endDate", end);
        
        return ResponseEntity.ok(result);
    }
}
