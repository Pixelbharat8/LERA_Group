package com.lera.connect_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "lead_activities", indexes = {
    @Index(name = "idx_lead_activities_lead", columnList = "lead_id"),
    @Index(name = "idx_lead_activities_type", columnList = "activity_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadActivity {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "lead_id", nullable = false)
    private UUID leadId;

    @Column(name = "activity_type", nullable = false, length = 50)
    private String activityType; // CALL, EMAIL, MEETING, NOTE, STATUS_CHANGE, TASK, FORM_SUBMIT

    @Column(name = "activity_title", length = 200)
    private String activityTitle;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "activity_data", columnDefinition = "TEXT")
    private String activityData; // JSON - additional data specific to activity type

    @Column(name = "performed_by")
    private UUID performedBy;

    @Column(name = "related_entity_type", length = 50)
    private String relatedEntityType; // FOLLOWUP, NOTE, EMAIL, CALL, etc.

    @Column(name = "related_entity_id")
    private UUID relatedEntityId;

    @Column(name = "activity_date", nullable = false)
    @Builder.Default
    private LocalDateTime activityDate = LocalDateTime.now();

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(columnDefinition = "TEXT")
    private String outcome;

    @Column(name = "is_important")
    @Builder.Default
    private Boolean isImportant = false;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
