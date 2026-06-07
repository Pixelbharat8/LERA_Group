package com.lera.academy_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A re-enrolment (retention) opportunity: a student whose current enrolment is ending soon.
 * Generated from enrolments approaching their end date so staff can chase the renewal before
 * the student churns. Pipeline: PENDING → CONTACTED → RENEWED / DECLINED / CHURNED.
 */
@Entity
@Table(name = "renewals", indexes = {
        @Index(name = "idx_renewal_status", columnList = "status"),
        @Index(name = "idx_renewal_center", columnList = "center_id"),
        @Index(name = "idx_renewal_enrollment", columnList = "current_enrollment_id"),
        @Index(name = "idx_renewal_end_date", columnList = "end_date")
})
@Data
public class Renewal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull
    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    /** The ending enrolment that triggered this renewal (one renewal per enrolment). */
    @Column(name = "current_enrollment_id")
    private UUID currentEnrollmentId;

    @Column(name = "class_id")
    private UUID classId;

    @Column(name = "program_id")
    private UUID programId;

    @Column(name = "center_id")
    private UUID centerId;

    /** End date of the current enrolment — the renewal deadline. */
    @Column(name = "end_date")
    private LocalDate endDate;

    /** PENDING | CONTACTED | RENEWED | DECLINED | CHURNED */
    @Column(name = "status")
    private String status = "PENDING";

    @Column(name = "assigned_to")
    private UUID assignedTo;

    @Column(name = "reminder_date")
    private LocalDate reminderDate;

    /** The new enrolment created when the student renews. */
    @Column(name = "renewed_enrollment_id")
    private UUID renewedEnrollmentId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (status == null) status = "PENDING";
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
