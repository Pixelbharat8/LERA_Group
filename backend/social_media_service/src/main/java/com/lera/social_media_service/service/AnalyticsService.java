package com.lera.social_media_service.service;

import com.lera.social_media_service.entity.*;
import com.lera.social_media_service.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AnalyticsService {
    
    private final SocialAnalyticsRepository analyticsRepository;
    private final SocialMediaPostRepository postRepository;
    private final SocialPlatformRepository platformRepository;
    private final LeadRepository leadRepository;
    private final MarketingCampaignRepository campaignRepository;
    
    // ===================== PLATFORM ANALYTICS =====================
    
    public Map<String, Object> getPlatformAnalytics(UUID platformId) {
        Map<String, Object> analytics = new HashMap<>();
        
        SocialPlatform platform = platformRepository.findById(platformId)
                .orElseThrow(() -> new RuntimeException("Platform not found: " + platformId));
        
        analytics.put("platform", platform.getPlatformName());
        analytics.put("followers", platform.getFollowerCount());
        
        // Get latest analytics by platform name
        List<SocialAnalytics> recentAnalytics = analyticsRepository
                .findByPlatformOrderByMetricDateDesc(platform.getPlatformName());
        
        if (!recentAnalytics.isEmpty()) {
            SocialAnalytics latest = recentAnalytics.get(0);
            analytics.put("totalImpressions", latest.getTotalImpressions());
            analytics.put("totalReach", latest.getTotalReach());
            analytics.put("followers", latest.getFollowers());
            analytics.put("newFollowers", latest.getNewFollowers());
            analytics.put("metricDate", latest.getMetricDate());
        }
        
        // Calculate growth
        if (recentAnalytics.size() > 1) {
            SocialAnalytics latest = recentAnalytics.get(0);
            SocialAnalytics previous = recentAnalytics.get(1);
            
            if (previous.getTotalImpressions() != null && previous.getTotalImpressions() > 0) {
                double impressionGrowth = ((double) (latest.getTotalImpressions() - previous.getTotalImpressions()) 
                        / previous.getTotalImpressions()) * 100;
                analytics.put("impressionGrowth", impressionGrowth);
            }
        }
        
        return analytics;
    }
    
    public Map<String, Object> getPlatformAnalyticsByName(String platformName) {
        Map<String, Object> analytics = new HashMap<>();
        
        analytics.put("platform", platformName);
        
        // Get latest analytics by platform name
        List<SocialAnalytics> recentAnalytics = analyticsRepository
                .findByPlatformOrderByMetricDateDesc(platformName);
        
        if (!recentAnalytics.isEmpty()) {
            SocialAnalytics latest = recentAnalytics.get(0);
            analytics.put("totalImpressions", latest.getTotalImpressions());
            analytics.put("totalReach", latest.getTotalReach());
            analytics.put("followers", latest.getFollowers());
            analytics.put("newFollowers", latest.getNewFollowers());
            analytics.put("metricDate", latest.getMetricDate());
        }
        
        return analytics;
    }
    
    public Map<String, Object> getAllPlatformsSummary() {
        Map<String, Object> summary = new HashMap<>();
        
        List<SocialPlatform> platforms = platformRepository.findAll();
        long totalFollowers = 0;
        long totalImpressions = 0;
        
        List<Map<String, Object>> platformSummaries = new ArrayList<>();
        
        for (SocialPlatform platform : platforms) {
            Map<String, Object> platformData = getPlatformAnalytics(platform.getId());
            platformSummaries.add(platformData);
            
            totalFollowers += platform.getFollowerCount() != null ? platform.getFollowerCount() : 0;
            
            if (platformData.get("totalImpressions") != null) {
                totalImpressions += ((Number) platformData.get("totalImpressions")).longValue();
            }
        }
        
        summary.put("platforms", platformSummaries);
        summary.put("totalFollowers", totalFollowers);
        summary.put("totalImpressions", totalImpressions);
        
        return summary;
    }
    
    // ===================== POST ANALYTICS =====================
    
    public Map<String, Object> getPostAnalytics(UUID postId) {
        Map<String, Object> analytics = new HashMap<>();
        
        SocialMediaPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found: " + postId));
        
        analytics.put("post", post);
        analytics.put("likes", post.getLikes());
        analytics.put("comments", post.getComments());
        analytics.put("shares", post.getShares());
        analytics.put("views", post.getImpressions());
        analytics.put("reach", post.getReach());
        analytics.put("impressions", post.getImpressions());
        
        // Calculate engagement rate
        int totalEngagement = (post.getLikes() != null ? post.getLikes() : 0)
                + (post.getComments() != null ? post.getComments() : 0)
                + (post.getShares() != null ? post.getShares() : 0);
        
        double engagementRate = post.getImpressions() != null && post.getImpressions() > 0 ?
                (double) totalEngagement / post.getImpressions() * 100 : 0;
        analytics.put("engagementRate", engagementRate);
        
        return analytics;
    }
    
    public List<Map<String, Object>> getTopPerformingPosts(int limit) {
        // DB sorts + limits to top-N by likes — no longer pulls every post into memory.
        return postRepository.findTopByLikes(org.springframework.data.domain.PageRequest.of(0, Math.max(1, limit)))
                .stream()
                .map(post -> getPostAnalytics(post.getId()))
                .toList();
    }
    
    public Map<String, Object> getPostingAnalytics(LocalDateTime start, LocalDateTime end) {
        Map<String, Object> analytics = new HashMap<>();
        
        List<SocialMediaPost> posts =
                postRepository.findByPublishedAtAfterAndPublishedAtBefore(start, end);
        
        analytics.put("totalPosts", posts.size());
        
        // Group by platform
        Map<String, Long> postsByPlatform = new HashMap<>();
        for (SocialMediaPost post : posts) {
            if (post.getPlatforms() != null) {
                for (String platform : post.getPlatforms()) {
                    postsByPlatform.merge(platform, 1L, Long::sum);
                }
            }
        }
        analytics.put("postsByPlatform", postsByPlatform);
        
        // Group by day of week
        Map<String, Long> postsByDayOfWeek = new HashMap<>();
        for (SocialMediaPost post : posts) {
            if (post.getPublishedAt() != null) {
                String dayOfWeek = post.getPublishedAt().getDayOfWeek().toString();
                postsByDayOfWeek.merge(dayOfWeek, 1L, Long::sum);
            }
        }
        analytics.put("postsByDayOfWeek", postsByDayOfWeek);
        
        // Calculate average engagement
        int totalLikes = posts.stream().mapToInt(p -> p.getLikes() != null ? p.getLikes() : 0).sum();
        int totalComments = posts.stream().mapToInt(p -> p.getComments() != null ? p.getComments() : 0).sum();
        int totalShares = posts.stream().mapToInt(p -> p.getShares() != null ? p.getShares() : 0).sum();
        
        analytics.put("totalLikes", totalLikes);
        analytics.put("totalComments", totalComments);
        analytics.put("totalShares", totalShares);
        analytics.put("averageLikesPerPost", posts.size() > 0 ? (double) totalLikes / posts.size() : 0);
        analytics.put("averageCommentsPerPost", posts.size() > 0 ? (double) totalComments / posts.size() : 0);
        
        return analytics;
    }
    
    // ===================== TREND ANALYTICS =====================
    
    public List<Map<String, Object>> getAnalyticsTrend(String platformName, int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);
        
        List<SocialAnalytics> analytics = analyticsRepository
                .findByPlatformAndDateRange(platformName, startDate, endDate);
        
        List<Map<String, Object>> trend = new ArrayList<>();
        
        for (SocialAnalytics record : analytics) {
            Map<String, Object> dataPoint = new HashMap<>();
            dataPoint.put("date", record.getMetricDate());
            dataPoint.put("impressions", record.getTotalImpressions());
            dataPoint.put("reach", record.getTotalReach());
            dataPoint.put("followers", record.getFollowers());
            dataPoint.put("newFollowers", record.getNewFollowers());
            trend.add(dataPoint);
        }
        
        return trend;
    }
    
    public Map<String, Object> getGrowthMetrics(String platformName, int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);
        LocalDate previousStart = startDate.minusDays(days);
        
        List<SocialAnalytics> currentPeriod = analyticsRepository
                .findByPlatformAndDateRange(platformName, startDate, endDate);
        
        List<SocialAnalytics> previousPeriod = analyticsRepository
                .findByPlatformAndDateRange(platformName, previousStart, startDate);
        
        Map<String, Object> growth = new HashMap<>();
        
        long currentImpressions = currentPeriod.stream()
                .mapToLong(a -> a.getTotalImpressions() != null ? a.getTotalImpressions() : 0).sum();
        long previousImpressions = previousPeriod.stream()
                .mapToLong(a -> a.getTotalImpressions() != null ? a.getTotalImpressions() : 0).sum();
        
        growth.put("impressionGrowth", calculateGrowthPercentage(previousImpressions, currentImpressions));
        
        long currentFollowers = currentPeriod.stream()
                .mapToLong(a -> a.getNewFollowers() != null ? a.getNewFollowers() : 0).sum();
        long previousFollowers = previousPeriod.stream()
                .mapToLong(a -> a.getNewFollowers() != null ? a.getNewFollowers() : 0).sum();
        
        growth.put("followerGrowth", calculateGrowthPercentage(previousFollowers, currentFollowers));
        
        return growth;
    }
    
    private double calculateGrowthPercentage(long previous, long current) {
        if (previous == 0) return current > 0 ? 100.0 : 0.0;
        return ((double) (current - previous) / previous) * 100;
    }
    
    // ===================== DASHBOARD SUMMARY =====================
    
    public Map<String, Object> getDashboardSummary() {
        Map<String, Object> dashboard = new HashMap<>();
        
        // Platform summary
        dashboard.put("platformsSummary", getAllPlatformsSummary());
        
        // Post statistics
        // DB-side, case-insensitive counts (previously loaded all posts AND missed lowercase statuses).
        long totalPosts = postRepository.count();
        long publishedPosts = postRepository.countByStatusIgnoreCase("PUBLISHED");
        long scheduledPosts = postRepository.countByStatusIgnoreCase("SCHEDULED");
        long draftPosts = postRepository.countByStatusIgnoreCase("DRAFT");
        
        dashboard.put("postStats", Map.of(
                "total", totalPosts,
                "published", publishedPosts,
                "scheduled", scheduledPosts,
                "drafts", draftPosts
        ));
        
        // Lead statistics
        long totalLeads = leadRepository.count();
        long newLeads = leadRepository.countByStatus("NEW");
        long convertedLeads = leadRepository.countByStatus("CONVERTED");
        
        dashboard.put("leadStats", Map.of(
                "total", totalLeads,
                "new", newLeads,
                "converted", convertedLeads,
                "conversionRate", totalLeads > 0 ? (double) convertedLeads / totalLeads * 100 : 0
        ));
        
        // Campaign statistics
        long totalCampaigns = campaignRepository.count();
        long activeCampaigns = campaignRepository.countByStatus("ACTIVE");
        
        dashboard.put("campaignStats", Map.of(
                "total", totalCampaigns,
                "active", activeCampaigns
        ));
        
        // Top performing posts (last 7 days)
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        long recentPostsCount = allPosts.stream()
                .filter(p -> p.getPublishedAt() != null && p.getPublishedAt().isAfter(weekAgo))
                .count();
        dashboard.put("recentPostsCount", recentPostsCount);
        
        return dashboard;
    }
    
    // ===================== REPORTING =====================
    
    public Map<String, Object> generateReport(LocalDateTime start, LocalDateTime end, String reportType) {
        Map<String, Object> report = new HashMap<>();
        report.put("reportType", reportType);
        report.put("startDate", start);
        report.put("endDate", end);
        report.put("generatedAt", LocalDateTime.now());
        
        switch (reportType.toLowerCase()) {
            case "engagement":
                report.put("data", getPostingAnalytics(start, end));
                break;
            case "growth":
                int days = (int) ChronoUnit.DAYS.between(start.toLocalDate(), end.toLocalDate());
                List<SocialPlatform> platforms = platformRepository.findAll();
                Map<String, Object> growthData = new HashMap<>();
                for (SocialPlatform platform : platforms) {
                    growthData.put(platform.getPlatformName(), getGrowthMetrics(platform.getPlatformName(), days));
                }
                report.put("data", growthData);
                break;
            case "leads":
                List<Lead> leads = leadRepository.findByCreatedAtAfter(start);
                report.put("data", Map.of(
                        "totalLeads", leads.size(),
                        "bySource", groupLeadsBySource(leads),
                        "byStatus", groupLeadsByStatus(leads)
                ));
                break;
            default:
                report.put("data", getDashboardSummary());
        }
        
        return report;
    }
    
    private Map<String, Long> groupLeadsBySource(List<Lead> leads) {
        Map<String, Long> bySource = new HashMap<>();
        for (Lead lead : leads) {
            String source = lead.getSourcePlatform() != null ? lead.getSourcePlatform() : "unknown";
            bySource.merge(source, 1L, Long::sum);
        }
        return bySource;
    }
    
    private Map<String, Long> groupLeadsByStatus(List<Lead> leads) {
        Map<String, Long> byStatus = new HashMap<>();
        for (Lead lead : leads) {
            String status = lead.getStatus() != null ? lead.getStatus() : "unknown";
            byStatus.merge(status, 1L, Long::sum);
        }
        return byStatus;
    }
}
