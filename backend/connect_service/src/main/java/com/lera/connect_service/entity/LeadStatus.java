package com.lera.connect_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "lead_statuses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadStatus {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    // DB column is status_name
    @Column(name = "status_name", nullable = false, unique = true, length = 100)
    private String statusName;

    @Column(name = "status_code", unique = true, length = 50)
    private String statusCode;

    @Column(columnDefinition = "TEXT")
    private String description;

    // DB has both `color` and `color_code`; map to color_code (preferred)
    @Column(name = "color_code", length = 20)
    private String colorCode;

    @Column(name = "icon", length = 50)
    private String icon;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_default")
    @Builder.Default
    private Boolean isDefault = false;

    @Column(name = "is_final")
    @Builder.Default
    private Boolean isFinal = false;

    @Column(name = "auto_actions", columnDefinition = "TEXT")
    private String autoActions;

    @Column(name = "required_fields", columnDefinition = "TEXT")
    private String requiredFields;

    @Column(name = "next_statuses", columnDefinition = "TEXT")
    private String nextStatuses;

    // DB has created_at with default now()
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
