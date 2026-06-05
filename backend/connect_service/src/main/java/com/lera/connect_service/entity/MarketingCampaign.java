package com.lera.connect_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
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
    private String campaignType; // EMAIL, SMS, SOCIAL_MEDIA, EVENT, WEBINAR

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(precision = 12, scale = 2)
    @PositiveOrZero
    private BigDecimal budget;

    @Column(name = "spent_amount", precision = 12, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal spentAmount = BigDecimal.ZERO;

    @Column(name = "target_audience", columnDefinition = "TEXT")
    private String targetAudience; // JSON

    @Column(length = 50)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT, SCHEDULED, ACTIVE, PAUSED, COMPLETED

    @Column(name = "leads_generated")
    @Builder.Default
    private Integer leadsGenerated = 0;

    @Column(name = "conversions")
    @Builder.Default
    private Integer conversions = 0;

    @Column(name = "email_sent")
    @Builder.Default
    private Integer emailSent = 0;

    @Column(name = "email_opened")
    @Builder.Default
    private Integer emailOpened = 0;

    @Column(name = "email_clicked")
    @Builder.Default
    private Integer emailClicked = 0;

    @Column(name = "created_by")
    private UUID createdBy;

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
