package com.lera.academy_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * An internal staff training session (professional development). Staff register, attendance is
 * verified, and completion can feed a {@link StaffCertification}. Persisted (real backend).
 */
@Entity
@Table(name = "training_sessions", indexes = {
        @Index(name = "idx_training_center", columnList = "center_id"),
        @Index(name = "idx_training_scheduled", columnList = "scheduled_at"),
        @Index(name = "idx_training_status", columnList = "status")
})
@Data
public class TrainingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** e.g. Methodology, Classroom Management, Compliance, Onboarding */
    @Column(name = "category")
    private String category;

    @Column(name = "trainer")
    private String trainer;

    @NotNull
    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Column(name = "duration_minutes")
    private Integer durationMinutes = 60;

    @Column(name = "location")
    private String location;

    @Column(name = "capacity")
    private Integer capacity;

    /** SCHEDULED | COMPLETED | CANCELLED */
    @Column(name = "status")
    private String status = "SCHEDULED";

    @Column(name = "center_id")
    private UUID centerId;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (status == null) status = "SCHEDULED";
        if (durationMinutes == null) durationMinutes = 60;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
