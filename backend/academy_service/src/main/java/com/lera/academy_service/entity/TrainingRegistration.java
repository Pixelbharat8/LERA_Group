package com.lera.academy_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A staff member's registration for a {@link TrainingSession}. Tracks attendance outcome.
 */
@Entity
@Table(name = "training_registrations", indexes = {
        @Index(name = "idx_treg_session", columnList = "session_id"),
        @Index(name = "idx_treg_user", columnList = "user_id")
}, uniqueConstraints = @UniqueConstraint(name = "uq_treg_session_user", columnNames = {"session_id", "user_id"}))
@Data
public class TrainingRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull
    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "user_name")
    private String userName;

    /** REGISTERED | ATTENDED | NO_SHOW | CANCELLED */
    @Column(name = "status")
    private String status = "REGISTERED";

    @Column(name = "registered_at", updatable = false)
    private LocalDateTime registeredAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (registeredAt == null) registeredAt = now;
        if (status == null) status = "REGISTERED";
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
