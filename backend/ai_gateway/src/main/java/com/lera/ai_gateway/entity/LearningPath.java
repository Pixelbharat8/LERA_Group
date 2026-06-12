package com.lera.ai_gateway.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "learning_paths", indexes = {
    @Index(name = "idx_learning_paths_student", columnList = "student_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningPath {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "path_name", nullable = false)
    private String pathName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "subject", length = 100)
    private String subject;

    @Column(name = "difficulty_level", length = 50)
    private String difficultyLevel; // BEGINNER, INTERMEDIATE, ADVANCED

    @Column(name = "total_steps")
    @Builder.Default
    private Integer totalSteps = 0;

    @Column(name = "completed_steps")
    @Builder.Default
    private Integer completedSteps = 0;

    @Column(name = "estimated_duration_hours")
    private Integer estimatedDurationHours;

    @Column(name = "actual_duration_hours")
    @Builder.Default
    private Integer actualDurationHours = 0;

    @Column(name = "learning_objectives", columnDefinition = "TEXT")
    private String learningObjectives; // JSON array

    @Column(name = "milestones", columnDefinition = "TEXT")
    private String milestones; // JSON array

    @Column(name = "progress_percentage", precision = 5, scale = 2)
    @Builder.Default
    private java.math.BigDecimal progressPercentage = java.math.BigDecimal.ZERO;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "target_completion_date")
    private java.time.LocalDate targetCompletionDate;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(length = 50)
    @Builder.Default
    private String status = "NOT_STARTED"; // NOT_STARTED, IN_PROGRESS, ON_HOLD, COMPLETED, ABANDONED

    @Column(name = "ai_generated")
    @Builder.Default
    private Boolean aiGenerated = false;

    @Column(name = "personalization_factors", columnDefinition = "TEXT")
    private String personalizationFactors; // JSON - learning style, pace, interests

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
