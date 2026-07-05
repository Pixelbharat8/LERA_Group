package com.lera.identity_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Persistent one-time password-reset / onboarding set-password token. Replaces the previous
 * in-memory map so links survive a restart and work across multiple identity instances.
 * Single-use: the row is deleted when the token is consumed; expired rows are purged on a timer.
 */
@Entity
@Table(name = "password_reset_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetToken {

    @Id
    @Column(length = 64)
    private String token;

    @Column(nullable = false)
    private String email;

    /** Epoch millis at which this token expires. */
    @Column(name = "expires_at", nullable = false)
    private Long expiresAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
