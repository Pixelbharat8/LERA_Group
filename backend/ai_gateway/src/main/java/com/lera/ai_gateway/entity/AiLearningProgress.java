package com.lera.ai_gateway.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_learning_progress", indexes = {
    @Index(name = "idx_ai_learning_progress_student", columnList = "student_id"),
    @Index(name = "idx_ai_learning_progress_path", columnList = "learning_path_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiLearningProgress {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "learning_path_id")
    private UUID learningPathId;

    @Column(name = "subject", length = 100)
    private String subject;

    @Column(name = "topic", length = 200)
    private String topic;

    @Column(name = "skill_level", length = 50)
    @Builder.Default
    private String skillLevel = "BEGINNER"; // BEGINNER, ELEMENTARY, INTERMEDIATE, ADVANCED, EXPERT

    @Column(name = "proficiency_score", precision = 5, scale = 2)
    @Builder.Default
    private java.math.BigDecimal proficiencyScore = java.math.BigDecimal.ZERO; // 0-100

    @Column(name = "previous_score", precision = 5, scale = 2)
    private java.math.BigDecimal previousScore;

    @Column(name = "score_change", precision = 5, scale = 2)
    private java.math.BigDecimal scoreChange;

    @Column(name = "strengths", columnDefinition = "TEXT")
    private String strengths; // JSON array

    @Column(name = "weaknesses", columnDefinition = "TEXT")
    private String weaknesses; // JSON array

    @Column(name = "learning_style", length = 50)
    private String learningStyle; // VISUAL, AUDITORY, KINESTHETIC, READING_WRITING

    @Column(name = "study_time_hours", precision = 8, scale = 2)
    @Builder.Default
    private java.math.BigDecimal studyTimeHours = java.math.BigDecimal.ZERO;

    @Column(name = "exercises_completed")
    @Builder.Default
    private Integer exercisesCompleted = 0;

    @Column(name = "exercises_accuracy", precision = 5, scale = 2)
    private java.math.BigDecimal exercisesAccuracy;

    @Column(name = "concepts_mastered")
    @Builder.Default
    private Integer conceptsMastered = 0;

    @Column(name = "concepts_in_progress")
    @Builder.Default
    private Integer conceptsInProgress = 0;

    @Column(name = "next_recommended_topic", length = 200)
    private String nextRecommendedTopic;

    @Column(name = "ai_insights", columnDefinition = "TEXT")
    private String aiInsights; // JSON - AI-generated insights

    @Column(name = "last_activity_date")
    private java.time.LocalDate lastActivityDate;

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
