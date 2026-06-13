package com.lera.academy_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * User feedback (course / instructor / facility / administrative). Persisted so feedback
 * and its rating roll-ups survive restarts — replaces the previous in-memory stub.
 */
@Entity
@Table(name = "feedback", indexes = {
        @Index(name = "idx_feedback_center", columnList = "center_id"),
        @Index(name = "idx_feedback_status", columnList = "status")
})
@Data
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "user_name")
    private String userName;

    /** Course | Instructor | Facility | Administrative */
    @Column(name = "category")
    private String category;

    @Column(name = "subject")
    private String subject;

    @NotBlank
    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    @Min(1)
    @Max(5)
    @Column(name = "rating")
    private Integer rating;

    /** NEW | REVIEWED | RESOLVED | PENDING */
    @Column(name = "status")
    private String status = "NEW";

    @Column(name = "center_id")
    private UUID centerId;

    @Column(name = "reviewed_by")
    private String reviewedBy;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (status == null) status = "NEW";
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
