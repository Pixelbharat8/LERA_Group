package com.lera.connect_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_automations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmAutomation {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "automation_name", nullable = false)
    private String automationName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "trigger_type", length = 100)
    private String triggerType; // LEAD_CREATED, LEAD_STATUS_CHANGED, EMAIL_OPENED, etc.

    @Column(name = "trigger_conditions", columnDefinition = "TEXT")
    private String triggerConditions; // JSON

    @Column(columnDefinition = "TEXT")
    private String actions; // JSON array of actions to perform

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "execution_count")
    @Builder.Default
    private Integer executionCount = 0;

    @Column(name = "last_executed_at")
    private LocalDateTime lastExecutedAt;

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
