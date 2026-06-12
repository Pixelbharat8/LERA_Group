package com.lera.identity_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tenant {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(nullable = false)
    private String name;

    private String domain;

    @Column(length = 100)
    private String subdomain;

    @Column(length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(length = 50)
    private String subscriptionPlan;

    private LocalDate subscriptionExpiresAt;

    @Builder.Default
    private Integer maxCenters = 1;

    @Builder.Default
    private Integer maxUsers = 100;

    @Column(columnDefinition = "TEXT")
    private String features; // JSON string

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
