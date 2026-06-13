package com.lera.social_media_service.entity;

import java.math.BigDecimal;
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
@Table(name = "ad_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdAccount {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(length = 50, nullable = false)
    private String platform; // facebook, google, tiktok, youtube

    @Column(name = "account_id", nullable = false)
    private String accountId;

    @Column(name = "account_name")
    private String accountName;

    @Column(length = 10)
    @Builder.Default
    private String currency = "VND";

    @Column(length = 50)
    @Builder.Default
    private String timezone = "Asia/Ho_Chi_Minh";

    // Authentication
    @Column(name = "access_token", columnDefinition = "TEXT")
    private String accessToken;

    @Column(name = "refresh_token", columnDefinition = "TEXT")
    private String refreshToken;

    @Column(name = "token_expires_at")
    private LocalDateTime tokenExpiresAt;

    // Budget
    @Column(name = "daily_budget", precision = 15, scale = 2)
    @PositiveOrZero
    private BigDecimal dailyBudget;

    @Column(name = "total_budget", precision = 15, scale = 2)
    @PositiveOrZero
    private BigDecimal totalBudget;

    @Column(name = "spent_today", precision = 15, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal spentToday = BigDecimal.ZERO;

    @Column(name = "spent_total", precision = 15, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal spentTotal = BigDecimal.ZERO;

    // Status
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_connected")
    @Builder.Default
    private Boolean isConnected = false;

    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;

    @Column(name = "sync_error")
    private String syncError;

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
