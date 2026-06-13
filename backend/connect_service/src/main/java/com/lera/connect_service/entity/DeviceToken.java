package com.lera.connect_service.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Push-notification routing for one device. The native client (iOS APNs,
 * Android FCM, browser web-push) registers its token here after the user logs
 * in; the {@code NotificationService} fans-out new notifications to all
 * tokens belonging to the target user.
 *
 * <p>Token strings are platform-opaque and can be huge (Apple's APNs tokens
 * are short, FCM v1 tokens are 152+ bytes), so the column is TEXT. Uniqueness
 * is on the token itself: re-registering the same token from a different
 * user replaces the prior row (handled in the controller).
 */
@Entity
@Table(name = "device_tokens", indexes = {
        @Index(name = "idx_device_tokens_user", columnList = "user_id"),
        @Index(name = "idx_device_tokens_token", columnList = "token", unique = true)
})
@Data
public class DeviceToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /** IOS, ANDROID, WEB. */
    @Column(nullable = false)
    private String platform;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String token;

    /** Optional human-friendly device name reported by the client. */
    @Column(name = "device_name")
    private String deviceName;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt = LocalDateTime.now();

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (lastSeenAt == null) lastSeenAt = LocalDateTime.now();
    }
}
