package com.lera.academy_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * An application against a {@link JobOpening} — the ATS pipeline record.
 */
@Entity
@Table(name = "job_applications", indexes = {
        @Index(name = "idx_app_job", columnList = "job_opening_id"),
        @Index(name = "idx_app_status", columnList = "status")
})
@Data
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull
    @Column(name = "job_opening_id", nullable = false)
    private UUID jobOpeningId;

    @NotBlank
    @Column(name = "applicant_name", nullable = false)
    private String applicantName;

    @Column(name = "email")
    private String email;

    @Column(name = "phone")
    private String phone;

    /** Existing staff applying for an internal transfer (optional). */
    @Column(name = "applicant_user_id")
    private UUID applicantUserId;

    @Column(name = "resume_url")
    private String resumeUrl;

    @Column(name = "cover_note", columnDefinition = "TEXT")
    private String coverNote;

    @Column(name = "source")
    private String source;

    /** APPLIED | SCREENING | INTERVIEW | OFFER | HIRED | REJECTED */
    @Column(name = "status")
    private String status = "APPLIED";

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "applied_at", updatable = false)
    private LocalDateTime appliedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (appliedAt == null) appliedAt = now;
        if (status == null) status = "APPLIED";
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
