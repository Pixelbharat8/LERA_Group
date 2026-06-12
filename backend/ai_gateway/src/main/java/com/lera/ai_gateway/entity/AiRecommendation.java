package com.lera.ai_gateway.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_recommendations", indexes = {
    @Index(name = "idx_ai_recommendations_student", columnList = "student_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiRecommendation {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "recommendation_type", length = 50)
    private String recommendationType; // COURSE, LEARNING_PATH, STUDY_MATERIAL, TUTOR, PRACTICE_EXERCISE

    @Column(name = "subject", length = 100)
    private String subject;

    @Column(name = "recommendation_title", nullable = false)
    private String recommendationTitle;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "recommended_item_id")
    private UUID recommendedItemId; // ID of course, material, etc.

    @Column(name = "recommended_item_type", length = 50)
    private String recommendedItemType; // COURSE, MATERIAL, EXERCISE, etc.

    @Column(name = "confidence_score", precision = 5, scale = 2)
    private java.math.BigDecimal confidenceScore; // 0-100

    @Column(name = "reasoning", columnDefinition = "TEXT")
    private String reasoning; // AI explanation

    @Column(name = "based_on", columnDefinition = "TEXT")
    private String basedOn; // JSON - performance, interests, learning style, etc.

    @Column(name = "priority", length = 20)
    @Builder.Default
    private String priority = "MEDIUM"; // HIGH, MEDIUM, LOW

    @Column(length = 50)
    @Builder.Default
    private String status = "PENDING"; // PENDING, VIEWED, ACCEPTED, REJECTED, COMPLETED

    @Column(name = "viewed_at")
    private LocalDateTime viewedAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "feedback_rating", precision = 3, scale = 1)
    private java.math.BigDecimal feedbackRating; // Out of 5

    @Column(name = "feedback_comment", columnDefinition = "TEXT")
    private String feedbackComment;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

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
