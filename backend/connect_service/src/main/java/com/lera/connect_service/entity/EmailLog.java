package com.lera.connect_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "email_logs", indexes = {
    @Index(name = "idx_email_logs_lead", columnList = "lead_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailLog {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "lead_id")
    private UUID leadId;

    @Column(name = "user_id")
    private UUID userId; // User who sent the email

    @Column(name = "email_to", nullable = false, length = 255)
    private String emailTo;

    @Column(name = "email_cc", length = 500)
    private String emailCc;

    @Column(name = "email_bcc", length = 500)
    private String emailBcc;

    @Column(name = "email_subject", length = 500)
    private String emailSubject;

    @Column(name = "email_body", columnDefinition = "TEXT")
    private String emailBody;

    @Column(name = "email_status", length = 50)
    @Builder.Default
    private String emailStatus = "SENT"; // SENT, FAILED, BOUNCED, QUEUED

    @Column(name = "template_id")
    private UUID templateId;

    @Column(columnDefinition = "TEXT")
    private String attachments; // JSON array of attachment URLs

    @Column(name = "sent_at", nullable = false)
    @Builder.Default
    private LocalDateTime sentAt = LocalDateTime.now();

    @Column(name = "opened_at")
    private LocalDateTime openedAt;

    @Column(name = "clicked_at")
    private LocalDateTime clickedAt;

    @Column(name = "replied_at")
    private LocalDateTime repliedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}
