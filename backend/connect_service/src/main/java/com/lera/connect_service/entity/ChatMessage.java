package com.lera.connect_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_messages", indexes = {
    @Index(name = "idx_chat_messages_lead", columnList = "lead_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "lead_id", nullable = false)
    private UUID leadId;

    @Column(name = "sender_id")
    private UUID senderId; // User who sent the message

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "message_type", length = 50)
    @Builder.Default
    private String messageType = "TEXT"; // TEXT, IMAGE, FILE, AUDIO, VIDEO

    @Column(name = "attachment_url", columnDefinition = "TEXT")
    private String attachmentUrl;

    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "sent_at", nullable = false)
    @Builder.Default
    private LocalDateTime sentAt = LocalDateTime.now();

    @Column(name = "edited_at")
    private LocalDateTime editedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // Reply to message feature (like Signal/Telegram/WhatsApp)
    @Column(name = "reply_to_id")
    private UUID replyToId;

    @Column(name = "reply_preview", columnDefinition = "TEXT")
    private String replyPreview;

    // Delivery status
    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    // Forwarded message
    @Column(name = "forwarded_from_id")
    private UUID forwardedFromId;

    // Voice message support
    @Column(name = "audio_duration_seconds")
    private Integer audioDurationSeconds;

    @Column(name = "audio_waveform", columnDefinition = "TEXT")
    private String audioWaveform;
}
