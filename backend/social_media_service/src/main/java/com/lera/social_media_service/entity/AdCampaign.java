package com.lera.social_media_service.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "ad_campaigns")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdCampaign {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "ad_account_id", nullable = false)
    private UUID adAccountId;
    
    @Column(name = "external_campaign_id")
    private String externalCampaignId;
    
    @Column(name = "campaign_name", nullable = false)
    private String campaignName;
    
    @Column(length = 50)
    private String objective; // AWARENESS, TRAFFIC, ENGAGEMENT, LEADS, CONVERSIONS
    
    @Column(length = 30)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT, ACTIVE, PAUSED, COMPLETED, ARCHIVED
    
    // Budget
    @Column(name = "daily_budget", precision = 15, scale = 2)
    @PositiveOrZero
    private BigDecimal dailyBudget;
    
    @Column(name = "lifetime_budget", precision = 15, scale = 2)
    @PositiveOrZero
    private BigDecimal lifetimeBudget;
    
    @Column(name = "spent_amount", precision = 15, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal spentAmount = BigDecimal.ZERO;
    
    // Schedule
    @Column(name = "start_date")
    private LocalDate startDate;
    
    @Column(name = "end_date")
    private LocalDate endDate;
    
    // Targeting
    @Column(name = "target_locations", columnDefinition = "TEXT")
    private String targetLocations; // JSON
    
    @Column(name = "target_age_min")
    private Integer targetAgeMin;
    
    @Column(name = "target_age_max")
    private Integer targetAgeMax;
    
    @Column(name = "target_genders", columnDefinition = "TEXT[]")
    private String[] targetGenders;
    
    @Column(name = "target_interests", columnDefinition = "TEXT")
    private String targetInterests; // JSON
    
    // Performance
    @Column
    @Builder.Default
    private Integer impressions = 0;
    
    @Column
    @Builder.Default
    private Integer clicks = 0;
    
    @Column
    @Builder.Default
    private Integer conversions = 0;
    
    @Column
    @Builder.Default
    private Integer reach = 0;
    
    @Column(name = "cost_per_click", precision = 10, scale = 2)
    @PositiveOrZero
    private BigDecimal costPerClick;
    
    @Column(name = "cost_per_conversion", precision = 10, scale = 2)
    @PositiveOrZero
    private BigDecimal costPerConversion;
    
    @Column(name = "click_through_rate", precision = 5, scale = 2)
    @PositiveOrZero
    @DecimalMax(value = "100", inclusive = true)
    private BigDecimal clickThroughRate;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
