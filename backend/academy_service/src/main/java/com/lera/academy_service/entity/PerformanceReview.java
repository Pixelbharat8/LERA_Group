package com.lera.academy_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A staff performance review / appraisal for a given period. DB-backed.
 * Pipeline: DRAFT → SUBMITTED → ACKNOWLEDGED (by the employee).
 */
@Entity
@Table(name = "performance_reviews", indexes = {
        @Index(name = "idx_perf_employee", columnList = "employee_id"),
        @Index(name = "idx_perf_reviewer", columnList = "reviewer_id"),
        @Index(name = "idx_perf_status", columnList = "status")
})
@Data
public class PerformanceReview {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull
    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name")
    private String employeeName;

    @Column(name = "reviewer_id")
    private UUID reviewerId;

    @Column(name = "reviewer_name")
    private String reviewerName;

    /** Review period label, e.g. "2026-Q2" or "2026 Annual". */
    @Column(name = "period")
    private String period;

    @Column(name = "review_date")
    private LocalDate reviewDate;

    @Min(1)
    @Max(5)
    @Column(name = "overall_rating")
    private Integer overallRating;

    @Column(name = "strengths", columnDefinition = "TEXT")
    private String strengths;

    @Column(name = "improvements", columnDefinition = "TEXT")
    private String improvements;

    @Column(name = "goals", columnDefinition = "TEXT")
    private String goals;

    /** DRAFT | SUBMITTED | ACKNOWLEDGED */
    @Column(name = "status")
    private String status = "DRAFT";

    @Column(name = "center_id")
    private UUID centerId;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (status == null) status = "DRAFT";
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
