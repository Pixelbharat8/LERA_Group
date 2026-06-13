package com.lera.academy_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A degree / certificate / credential held by a staff member (e.g. CELTA, TESOL, IELTS band,
 * first-aid). Tracked so the centre can prove qualifications and chase expiries.
 */
@Entity
@Table(name = "staff_certifications", indexes = {
        @Index(name = "idx_cert_user", columnList = "user_id"),
        @Index(name = "idx_cert_expiry", columnList = "expiry_date")
})
@Data
public class StaffCertification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "user_name")
    private String userName;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @Column(name = "issuer")
    private String issuer;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "credential_id")
    private String credentialId;

    /** Uploaded scan/PDF (via /api/upload). */
    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

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
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
