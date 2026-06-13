package com.lera.connect_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity for tracking blocked users
 * Similar to Signal/Telegram/Zalo block functionality
 */
@Entity
@Table(name = "blocked_users", indexes = {
    @Index(name = "idx_blocked_users_blocker", columnList = "blocker_id"),
    @Index(name = "idx_blocked_users_blocked", columnList = "blocked_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockedUser {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "blocker_id", nullable = false)
    private UUID blockerId;

    @Column(name = "blocked_id", nullable = false)
    private UUID blockedId;

    @Column(name = "blocked_at")
    @Builder.Default
    private LocalDateTime blockedAt = LocalDateTime.now();

    @Column(name = "reason")
    private String reason;
}
