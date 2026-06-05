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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "marketing_campaigns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketingCampaign {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "campaign_name", nullable = false)
    private String campaignName;

    @Column(name = "campaign_type", length = 50)
    private String campaignType; // SOCIAL_MEDIA, PAID_ADS, EMAIL, SMS, EVENT, WEBINAR

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    // Budget
    @Column(precision = 15, scale = 2)
    @PositiveOrZero
    private BigDecimal budget;

    @Column(name = "spent_amount", precision = 15, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal spentAmount = BigDecimal.ZERO;

    @Column(length = 10)
    @Builder.Default
    private String currency = "VND";

    // Targeting
    @Column(name = "target_audience", columnDefinition = "TEXT")
    private String targetAudience; // JSON

    @Column(name = "target_platforms", columnDefinition = "TEXT[]")
    private String[] targetPlatforms;

    @Column(name = "target_locations", columnDefinition = "TEXT[]")
    private String[] targetLocations;

    @Column(name = "target_age_min")
    private Integer targetAgeMin;

    @Column(name = "target_age_max")
    private Integer targetAgeMax;

    // Status
    @Column(length = 50)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT, SCHEDULED, ACTIVE, PAUSED, COMPLETED, CANCELLED

    // Performance Metrics
    @Column(name = "total_reach")
    @Builder.Default
    private Integer totalReach = 0;

    @Column(name = "total_impressions")
    @Builder.Default
    private Integer totalImpressions = 0;

    @Column(name = "total_clicks")
    @Builder.Default
    private Integer totalClicks = 0;

    @Column(name = "leads_generated")
    @Builder.Default
    private Integer leadsGenerated = 0;

    @Column(name = "conversions")
    @Builder.Default
    private Integer conversions = 0;

    @Column(name = "cost_per_lead", precision = 10, scale = 2)
    @PositiveOrZero
    private BigDecimal costPerLead;

    @Column(name = "cost_per_click", precision = 10, scale = 2)
    @PositiveOrZero
    private BigDecimal costPerClick;

    @Column(name = "roi_percentage", precision = 10, scale = 2)
    private BigDecimal roiPercentage;

    // Workflow
    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
