package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "assignments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Assignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(name = "title_vi")
    private String titleVi;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "description_vi", columnDefinition = "TEXT")
    private String descriptionVi;
    
    @Column(columnDefinition = "TEXT")
    private String instructions;
    
    @Column(name = "instructions_vi", columnDefinition = "TEXT")
    private String instructionsVi;
    
    @Column(name = "class_id", nullable = false)
    private UUID classId;
    
    @Column(name = "module_id")
    private Long moduleId;
    
    @Column(name = "lesson_id")
    private Long lessonId;
    
    @Column(name = "assignment_type", nullable = false)
    private String assignmentType; // HOMEWORK, QUIZ, PROJECT, CLASSWORK, PRACTICE, EXAM_PREP, READING
    
    @Column(name = "difficulty_level")
    private String difficultyLevel; // EASY, MEDIUM, HARD, MIXED
    
    @Column(name = "estimated_duration_minutes")
    private Integer estimatedDurationMinutes;
    
    @Column(name = "assigned_date", nullable = false)
    private LocalDate assignedDate;
    
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;
    
    @Column(name = "max_score", nullable = false)
    private Integer maxScore;
    
    @Column(name = "passing_score")
    private Integer passingScore;
    
    @Column(name = "is_graded")
    private Boolean isGraded;
    
    @Column(name = "late_submission_allowed")
    private Boolean lateSubmissionAllowed;
    
    @Column(name = "late_penalty_percentage")
    private Integer latePenaltyPercentage;
    
    @Column(name = "attachment_url")
    private String attachmentUrl;
    
    @Column(name = "attachment_name")
    private String attachmentName;
    
    @Column(name = "rubric", columnDefinition = "TEXT")
    private String rubric;
    
    @Column(name = "rubric_vi", columnDefinition = "TEXT")
    private String rubricVi;
    
    @Column(name = "lesson_plan_id")
    private Long lessonPlanId;
    
    @Column(name = "curriculum_id")
    private Long curriculumId;
    
    @Column(name = "center_id")
    private Long centerId;
    
    @Column(name = "is_published")
    private Boolean isPublished;
    
    @Column(name = "created_by", nullable = false)
    private Long createdBy;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (assignedDate == null) assignedDate = LocalDate.now();
    }
}
