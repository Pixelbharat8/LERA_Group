package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.Positive;

/**
 * Parent referral record. Backs {@code /api/referrals}.
 *
 * <p>Lifecycle: {@code PENDING -> CONTACTED -> CONVERTED} (or {@code REJECTED / EXPIRED}).
 * Once converted, {@link #studentId} should be set to the new student's id.
 */
@Entity
@Table(name = "referrals")
@Data
public class Referral {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "referrer_user_id")
    private UUID referrerUserId;

    @Column(name = "referred_email")
    private String referredEmail;

    @Column(name = "referred_name")
    private String referredName;

    @Column(name = "referred_phone", length = 50)
    private String referredPhone;

    @Column(name = "student_id")
    private UUID studentId;

    @Column(name = "center_id")
    private UUID centerId;

    @Column(name = "status", length = 20, nullable = false)
    private String status = "PENDING";

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "reward_amount", precision = 12, scale = 2)
    @Positive
    private BigDecimal rewardAmount;

    @Column(name = "reward_status", length = 20)
    private String rewardStatus = "NONE";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "converted_at")
    private LocalDateTime convertedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        if (status == null) status = "PENDING";
        if (rewardStatus == null) rewardStatus = "NONE";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
