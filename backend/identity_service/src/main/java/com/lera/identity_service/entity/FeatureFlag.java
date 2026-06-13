package com.lera.identity_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "feature_flags")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeatureFlag {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "flag_key", unique = true, nullable = false, length = 100)
    private String flagKey;

    @Column(name = "flag_name")
    private String flagName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_enabled")
    @Builder.Default
    private Boolean isEnabled = false;

    @Column(name = "rollout_percentage")
    @Builder.Default
    private Integer rolloutPercentage = 0;

    @Column(name = "target_tenants", columnDefinition = "TEXT")
    private String targetTenants; // JSON string

    @Column(name = "target_users", columnDefinition = "TEXT")
    private String targetUsers; // JSON string

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
