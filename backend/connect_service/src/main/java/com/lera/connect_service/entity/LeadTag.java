package com.lera.connect_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "lead_tags")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadTag {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tag_name", nullable = false, unique = true, length = 100)
    private String tagName;

    @Column(name = "tag_slug", unique = true, length = 100)
    private String tagSlug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "color_code", length = 20)
    @Builder.Default
    private String colorCode = "#3B82F6"; // Default blue

    @Column(name = "tag_category", length = 50)
    private String tagCategory; // INTEREST, SOURCE, BEHAVIOR, DEMOGRAPHIC, CUSTOM

    @Column(name = "usage_count")
    @Builder.Default
    private Integer usageCount = 0;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "auto_assign_rules", columnDefinition = "TEXT")
    private String autoAssignRules; // JSON - rules for auto-assigning this tag

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
