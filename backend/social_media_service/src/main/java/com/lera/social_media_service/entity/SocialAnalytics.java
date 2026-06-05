package com.lera.social_media_service.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "social_analytics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocialAnalytics {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(length = 50, nullable = false)
    private String platform;

    @Column(name = "metric_date", nullable = false)
    private LocalDate metricDate;

    // Followers
    @Column
    @Builder.Default
    private Integer followers = 0;

    @Column(name = "new_followers")
    @Builder.Default
    private Integer newFollowers = 0;

    @Column(name = "lost_followers")
    @Builder.Default
    private Integer lostFollowers = 0;

    @Column
    @Builder.Default
    private Integer following = 0;

    // Content
    @Column(name = "posts_count")
    @Builder.Default
    private Integer postsCount = 0;

    @Column(name = "stories_count")
    @Builder.Default
    private Integer storiesCount = 0;

    @Column(name = "reels_count")
    @Builder.Default
    private Integer reelsCount = 0;

    // Reach & Impressions
    @Column(name = "total_reach")
    @Builder.Default
    private Integer totalReach = 0;

    @Column(name = "total_impressions")
    @Builder.Default
    private Integer totalImpressions = 0;

    // Engagement
    @Column(name = "total_engagement")
    @Builder.Default
    private Integer totalEngagement = 0;

    @Column(name = "likes_count")
    @Builder.Default
    private Integer likesCount = 0;

    @Column(name = "comments_count")
    @Builder.Default
    private Integer commentsCount = 0;

    @Column(name = "shares_count")
    @Builder.Default
    private Integer sharesCount = 0;

    @Column(name = "saves_count")
    @Builder.Default
    private Integer savesCount = 0;

    // Rates
    @Column(name = "engagement_rate", precision = 5, scale = 2)
    @PositiveOrZero
    @DecimalMax(value = "100", inclusive = true)
    private BigDecimal engagementRate;

    @Column(name = "click_through_rate", precision = 5, scale = 2)
    @PositiveOrZero
    @DecimalMax(value = "100", inclusive = true)
    private BigDecimal clickThroughRate;

    // Profile Activity
    @Column(name = "profile_views")
    @Builder.Default
    private Integer profileViews = 0;

    @Column(name = "website_clicks")
    @Builder.Default
    private Integer websiteClicks = 0;

    @Column(name = "email_clicks")
    @Builder.Default
    private Integer emailClicks = 0;

    @Column(name = "phone_clicks")
    @Builder.Default
    private Integer phoneClicks = 0;

    // Demographics (JSON)
    @Column(columnDefinition = "TEXT")
    private String demographics;

    @Column(name = "top_posts", columnDefinition = "TEXT")
    private String topPosts;

    @Column(name = "audience_insights", columnDefinition = "TEXT")
    private String audienceInsights;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
