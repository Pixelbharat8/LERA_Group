package com.lera.identity_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "login_history", indexes = {
    @Index(name = "idx_login_history_user", columnList = "user_id"),
    @Index(name = "idx_login_history_login_at", columnList = "login_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginHistory {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "login_at", nullable = false)
    @Builder.Default
    private LocalDateTime loginAt = LocalDateTime.now();

    @Column(name = "logout_at")
    private LocalDateTime logoutAt;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "device_type", length = 50)
    private String deviceType;

    @Column(length = 100)
    private String browser;

    private String location;

    @Column(length = 20)
    @Builder.Default
    private String status = "SUCCESS";

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;
}
