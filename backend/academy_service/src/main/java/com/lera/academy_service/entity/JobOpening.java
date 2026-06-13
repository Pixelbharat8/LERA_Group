package com.lera.academy_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * An internal job opening / vacancy (recruitment + internal transfers). DB-backed.
 */
@Entity
@Table(name = "job_openings", indexes = {
        @Index(name = "idx_job_status", columnList = "status"),
        @Index(name = "idx_job_center", columnList = "center_id")
})
@Data
public class JobOpening {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank
    @Column(nullable = false)
    private String title;

    @Column(name = "department")
    private String department;

    @Column(name = "center_id")
    private UUID centerId;

    @Column(name = "location")
    private String location;

    /** FULL_TIME | PART_TIME | CONTRACT | INTERNAL_TRANSFER */
    @Column(name = "employment_type")
    private String employmentType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "requirements", columnDefinition = "TEXT")
    private String requirements;

    /** OPEN | CLOSED | DRAFT */
    @Column(name = "status")
    private String status = "OPEN";

    @Column(name = "openings_count")
    private Integer openingsCount = 1;

    @Column(name = "posted_date")
    private LocalDate postedDate;

    @Column(name = "closing_date")
    private LocalDate closingDate;

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
        if (status == null) status = "OPEN";
        if (postedDate == null) postedDate = LocalDate.now();
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
