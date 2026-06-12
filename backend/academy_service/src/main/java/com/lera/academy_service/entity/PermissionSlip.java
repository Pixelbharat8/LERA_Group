package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A permission slip (consent form) sent by a teacher / admin asking parents to
 * approve their child's participation in an activity (field trip, swim class,
 * vaccination, etc.). Each slip generates one {@link PermissionSlipResponse}
 * per parent reply.
 *
 * <p>Targeting: a slip can target either a specific class ({@code classId}) or
 * a center ({@code centerId}); when both are null it's effectively
 * organization-wide.
 */
@Entity
@Table(name = "permission_slips")
@Data
public class PermissionSlip {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(name = "title_vi")
    private String titleVi;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "description_vi", columnDefinition = "TEXT")
    private String descriptionVi;

    @Column(name = "activity_date")
    private LocalDateTime activityDate;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "class_id")
    private UUID classId;

    @Column(name = "center_id")
    private UUID centerId;

    @Column(name = "created_by")
    private UUID createdBy;

    /** OPEN, CLOSED. Closed slips no longer accept responses. */
    @Column(nullable = false)
    private String status = "OPEN";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    /**
     * Soft-delete marker. {@code null} means the row is live. We keep deleted
     * rows around so audit / compliance queries can still see who issued and
     * who responded — important for consent forms, where the trail matters.
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (status == null) status = "OPEN";
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
