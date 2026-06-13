package com.lera.connect_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "content_moderation_logs", indexes = {
    @Index(name = "idx_moderation_message", columnList = "message_id"),
    @Index(name = "idx_moderation_user", columnList = "user_id"),
    @Index(name = "idx_moderation_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentModerationLog {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "message_id", nullable = false)
    private UUID messageId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "conversation_id")
    private UUID conversationId;

    @Column(name = "academy_id")
    private UUID academyId;

    @Column(name = "original_content", columnDefinition = "TEXT", nullable = false)
    private String originalContent;

    @Column(name = "filtered_content", columnDefinition = "TEXT")
    private String filteredContent;

    @Column(name = "moderation_type", length = 30)
    @Builder.Default
    private String moderationType = "AUTO"; // AUTO, MANUAL, REPORTED

    @Column(name = "status", length = 20)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, BLOCKED, FLAGGED, REVIEWED

    @Column(name = "violation_type", length = 50)
    private String violationType; // PROFANITY, BULLYING, SPAM, SENSITIVE_INFO, INAPPROPRIATE

    @Column(name = "severity", length = 20)
    @Builder.Default
    private String severity = "LOW"; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(name = "confidence_score")
    private Double confidenceScore; // AI confidence 0.0 - 1.0

    @Column(name = "detected_keywords", columnDefinition = "TEXT")
    private String detectedKeywords; // JSON array

    @Column(name = "action_taken", length = 30)
    private String actionTaken; // NONE, WARNED, BLOCKED, DELETED, REPORTED_TO_ADMIN

    @Column(name = "reviewed_by_id")
    private UUID reviewedById;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @Column(name = "parent_notified")
    @Builder.Default
    private Boolean parentNotified = false;

    @Column(name = "teacher_notified")
    @Builder.Default
    private Boolean teacherNotified = false;

    @Column(name = "is_false_positive")
    @Builder.Default
    private Boolean isFalsePositive = false;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
}
