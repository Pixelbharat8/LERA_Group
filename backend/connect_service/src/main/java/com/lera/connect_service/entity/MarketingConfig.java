package com.lera.connect_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** Per-person marketing comp config: commission rate + monthly money target. */
@Entity
@Table(name = "marketing_config", uniqueConstraints = @UniqueConstraint(name = "uq_marketing_config_user", columnNames = "user_id"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketingConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "center_id")
    private UUID centerId;

    @Column(name = "commission_pct", precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal commissionPct = BigDecimal.ZERO;

    @Column(name = "monthly_target", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal monthlyTarget = BigDecimal.ZERO;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        if (commissionPct == null) commissionPct = BigDecimal.ZERO;
        if (monthlyTarget == null) monthlyTarget = BigDecimal.ZERO;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
