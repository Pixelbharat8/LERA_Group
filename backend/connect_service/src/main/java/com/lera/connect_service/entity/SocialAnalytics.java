package com.lera.connect_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
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

    @Column
    @Builder.Default
    private Integer followers = 0;

    @Column
    @Builder.Default
    private Integer following = 0;

    @Column(name = "posts_count")
    @Builder.Default
    private Integer postsCount = 0;

    @Column(name = "total_reach")
    @Builder.Default
    private Integer totalReach = 0;

    @Column(name = "total_impressions")
    @Builder.Default
    private Integer totalImpressions = 0;

    @Column(name = "total_engagement")
    @Builder.Default
    private Integer totalEngagement = 0;

    @Column(name = "engagement_rate", precision = 5, scale = 2)
    @PositiveOrZero
    @DecimalMax(value = "100", inclusive = true)
    private BigDecimal engagementRate;

    @Column(name = "new_followers")
    @Builder.Default
    private Integer newFollowers = 0;

    @Column(name = "lost_followers")
    @Builder.Default
    private Integer lostFollowers = 0;

    @Column(name = "profile_views")
    @Builder.Default
    private Integer profileViews = 0;

    @Column(name = "website_clicks")
    @Builder.Default
    private Integer websiteClicks = 0;

    @Column(columnDefinition = "TEXT")
    private String demographics; // JSON

    @Column(name = "top_posts", columnDefinition = "TEXT")
    private String topPosts; // JSON

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
