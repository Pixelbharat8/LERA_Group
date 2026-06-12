package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "center_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CenterSettings {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "center_id", nullable = false)
    private UUID centerId;

    @Column(name = "setting_key", nullable = false, length = 100)
    private String settingKey; // MAX_CLASS_SIZE, BOOKING_ADVANCE_DAYS, AUTO_REMINDER, etc.

    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String settingValue;

    @Column(name = "setting_type", length = 50)
    @Builder.Default
    private String settingType = "STRING"; // STRING, NUMBER, BOOLEAN, JSON

    @Column(name = "setting_category", length = 50)
    private String settingCategory; // GENERAL, ENROLLMENT, ATTENDANCE, PAYMENT, NOTIFICATION

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_editable")
    @Builder.Default
    private Boolean isEditable = true;

    @Column(name = "is_public")
    @Builder.Default
    private Boolean isPublic = false;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "validation_rules", columnDefinition = "TEXT")
    private String validationRules; // JSON

    @Column(name = "updated_by")
    private UUID updatedBy;

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
