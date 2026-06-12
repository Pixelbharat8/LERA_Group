package com.lera.ai_gateway.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_assessments", indexes = {
    @Index(name = "idx_ai_assessments_student", columnList = "student_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiAssessment {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "assessment_type", length = 50)
    private String assessmentType; // DIAGNOSTIC, FORMATIVE, SUMMATIVE, ADAPTIVE, PRACTICE

    @Column(name = "subject", length = 100)
    private String subject;

    @Column(name = "topic", length = 200)
    private String topic;

    @Column(name = "difficulty_level", length = 50)
    private String difficultyLevel;

    @Column(name = "total_questions")
    @Builder.Default
    private Integer totalQuestions = 0;

    @Column(name = "questions_attempted")
    @Builder.Default
    private Integer questionsAttempted = 0;

    @Column(name = "correct_answers")
    @Builder.Default
    private Integer correctAnswers = 0;

    @Column(name = "score_percentage", precision = 5, scale = 2)
    @Builder.Default
    private java.math.BigDecimal scorePercentage = java.math.BigDecimal.ZERO;

    @Column(name = "time_taken_minutes")
    private Integer timeTakenMinutes;

    @Column(name = "average_time_per_question")
    private java.math.BigDecimal averageTimePerQuestion;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(length = 50)
    @Builder.Default
    private String status = "NOT_STARTED"; // NOT_STARTED, IN_PROGRESS, COMPLETED, ABANDONED

    @Column(name = "questions_data", columnDefinition = "TEXT")
    private String questionsData; // JSON - questions, answers, correctness

    @Column(name = "skill_analysis", columnDefinition = "TEXT")
    private String skillAnalysis; // JSON - per-skill performance

    @Column(name = "ai_feedback", columnDefinition = "TEXT")
    private String aiFeedback; // Personalized feedback

    @Column(name = "improvement_areas", columnDefinition = "TEXT")
    private String improvementAreas; // JSON array

    @Column(name = "recommended_resources", columnDefinition = "TEXT")
    private String recommendedResources; // JSON array

    @Column(name = "next_difficulty_level", length = 50)
    private String nextDifficultyLevel;

    @Column(name = "adaptive_adjustments", columnDefinition = "TEXT")
    private String adaptiveAdjustments; // JSON - how AI adapted difficulty

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
