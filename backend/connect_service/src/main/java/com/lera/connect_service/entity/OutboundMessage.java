package com.lera.connect_service.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A log of every outbound transactional message (Zalo / SMS / Email) — so the centre has a
 * record even before a real provider is connected (status SKIPPED when unconfigured).
 */
@Entity
@Table(name = "outbound_messages", indexes = {
        @Index(name = "idx_outmsg_lead", columnList = "lead_id"),
        @Index(name = "idx_outmsg_channel", columnList = "channel"),
        @Index(name = "idx_outmsg_status", columnList = "status")
})
@Data
public class OutboundMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "lead_id")
    private UUID leadId;

    @Column(name = "to_phone")
    private String toPhone;

    /** ZALO | SMS | EMAIL */
    @Column(name = "channel", length = 20)
    private String channel;

    @Column(name = "body", columnDefinition = "TEXT")
    private String body;

    /** SENT | SKIPPED | FAILED | QUEUED */
    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "provider")
    private String provider;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "sent_by")
    private UUID sentBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
