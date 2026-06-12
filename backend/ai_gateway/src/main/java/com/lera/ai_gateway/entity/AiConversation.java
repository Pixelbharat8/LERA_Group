package com.lera.ai_gateway.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_conversations", indexes = {
    @Index(name = "idx_ai_conversations_user", columnList = "user_id"),
    @Index(name = "idx_ai_conversations_student", columnList = "student_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiConversation {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "student_id")
    private UUID studentId;

    @Column(name = "conversation_type", length = 50)
    private String conversationType; // TUTORING, ASSESSMENT, PRACTICE, HOMEWORK_HELP, GENERAL

    @Column(name = "subject", length = 100)
    private String subject; // English, Math, Science, etc.

    @Column(name = "topic", length = 200)
    private String topic;

    @Column(name = "ai_model", length = 50)
    @Builder.Default
    private String aiModel = "GPT-4"; // GPT-4, Claude, Gemini, etc.

    @Column(name = "message_count")
    @Builder.Default
    private Integer messageCount = 0;

    @Column(name = "session_duration_minutes")
    @Builder.Default
    private Integer sessionDurationMinutes = 0;

    @Column(name = "started_at", nullable = false)
    @Builder.Default
    private LocalDateTime startedAt = LocalDateTime.now();

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(length = 50)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, ENDED, PAUSED

    @Column(name = "satisfaction_rating", precision = 3, scale = 1)
    private java.math.BigDecimal satisfactionRating; // Out of 5

    @Column(name = "learning_outcome", columnDefinition = "TEXT")
    private String learningOutcome; // AI-generated summary

    @Column(name = "key_concepts", columnDefinition = "TEXT")
    private String keyConcepts; // JSON array

    @Column(name = "follow_up_needed")
    @Builder.Default
    private Boolean followUpNeeded = false;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
