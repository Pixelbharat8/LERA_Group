package com.lera.connect_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A trial / placement class booked for a CRM lead. The free-trial → enrolment step is the
 * key conversion lever for an English centre; this tracks the booking, attendance outcome,
 * placement level, and conversion. The owning {@link Lead}'s status is advanced in step
 * (TRIAL_BOOKED → TRIAL_ATTENDED/NO_SHOW → CONVERTED) by the controller.
 */
@Entity
@Table(name = "trial_sessions", indexes = {
        @Index(name = "idx_trial_lead", columnList = "lead_id"),
        @Index(name = "idx_trial_center", columnList = "center_id"),
        @Index(name = "idx_trial_scheduled", columnList = "scheduled_at"),
        @Index(name = "idx_trial_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrialSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull
    @Column(name = "lead_id", nullable = false)
    private UUID leadId;

    @Column(name = "center_id")
    private UUID centerId;

    @Column(name = "program_id")
    private UUID programId;

    @NotNull
    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Column(name = "duration_minutes")
    private Integer durationMinutes = 45;

    @Column(name = "teacher_id")
    private UUID teacherId;

    @Column(name = "location")
    private String location;

    /** BOOKED | ATTENDED | NO_SHOW | CONVERTED | CANCELLED */
    @Column(name = "status")
    private String status = "BOOKED";

    /** Placement result captured when the trial is attended (e.g. "A2", "Starters"). */
    @Column(name = "placement_level")
    private String placementLevel;

    @Column(name = "outcome_notes", columnDefinition = "TEXT")
    private String outcomeNotes;

    @Column(name = "converted_student_id")
    private UUID convertedStudentId;

    @Column(name = "conversion_date")
    private LocalDate conversionDate;

    @Column(name = "assigned_to")
    private UUID assignedTo;

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
        if (status == null) status = "BOOKED";
        if (durationMinutes == null) durationMinutes = 45;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
