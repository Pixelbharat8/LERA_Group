package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Lesson Plan entity - Teachers create lesson plans for each class session.
 * Links to curriculum, course module, and lesson to maintain the full teaching hierarchy:
 * Curriculum -> CourseModule -> CourseLesson -> LessonPlan
 *
 * Each LessonPlan represents a teacher's plan for a specific class on a specific date.
 */
@Entity
@Table(name = "lesson_plans", indexes = {
    @Index(name = "idx_lesson_plans_class", columnList = "class_id"),
    @Index(name = "idx_lesson_plans_teacher", columnList = "teacher_id"),
    @Index(name = "idx_lesson_plans_date", columnList = "plan_date"),
    @Index(name = "idx_lesson_plans_session", columnList = "session_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // ============ LINKING FIELDS ============

    @Column(name = "class_id", nullable = false)
    private UUID classId;

    @Column(name = "teacher_id", nullable = false)
    private UUID teacherId;

    @Column(name = "session_id")
    private UUID sessionId; // optional link to ClassSession

    @Column(name = "curriculum_id")
    private UUID curriculumId;

    @Column(name = "module_id")
    private UUID moduleId;

    @Column(name = "lesson_id")
    private UUID lessonId;

    @Column(name = "center_id")
    private UUID centerId;

    // ============ PLAN CONTENT ============

    @Column(nullable = false)
    private String title;

    @Column(name = "title_vi")
    private String titleVi;

    @Column(name = "plan_date", nullable = false)
    private LocalDate planDate;

    @Column(name = "week_number")
    private Integer weekNumber;

    @Column(name = "term")
    private String term; // TERM_1, TERM_2, SUMMER, etc.

    @Column(name = "subject")
    private String subject;

    @Column(name = "grade_level")
    private String gradeLevel;

    // ============ OBJECTIVES & CONTENT ============

    @Column(columnDefinition = "TEXT")
    private String objectives;

    @Column(name = "objectives_vi", columnDefinition = "TEXT")
    private String objectivesVi;

    @Column(name = "learning_outcomes", columnDefinition = "TEXT")
    private String learningOutcomes;

    @Column(name = "learning_outcomes_vi", columnDefinition = "TEXT")
    private String learningOutcomesVi;

    @Column(name = "warm_up_activity", columnDefinition = "TEXT")
    private String warmUpActivity;

    @Column(name = "warm_up_activity_vi", columnDefinition = "TEXT")
    private String warmUpActivityVi;

    @Column(name = "warm_up_duration_minutes")
    @Builder.Default
    private Integer warmUpDurationMinutes = 10;

    @Column(name = "main_activity", columnDefinition = "TEXT")
    private String mainActivity;

    @Column(name = "main_activity_vi", columnDefinition = "TEXT")
    private String mainActivityVi;

    @Column(name = "main_activity_duration_minutes")
    @Builder.Default
    private Integer mainActivityDurationMinutes = 30;

    @Column(name = "practice_activity", columnDefinition = "TEXT")
    private String practiceActivity;

    @Column(name = "practice_activity_vi", columnDefinition = "TEXT")
    private String practiceActivityVi;

    @Column(name = "practice_duration_minutes")
    @Builder.Default
    private Integer practiceDurationMinutes = 20;

    @Column(name = "cool_down_activity", columnDefinition = "TEXT")
    private String coolDownActivity;

    @Column(name = "cool_down_activity_vi", columnDefinition = "TEXT")
    private String coolDownActivityVi;

    @Column(name = "cool_down_duration_minutes")
    @Builder.Default
    private Integer coolDownDurationMinutes = 10;

    @Column(name = "total_duration_minutes")
    @Builder.Default
    private Integer totalDurationMinutes = 90;

    // ============ MATERIALS & RESOURCES ============

    @Column(name = "materials_needed", columnDefinition = "TEXT")
    private String materialsNeeded;

    @Column(name = "materials_needed_vi", columnDefinition = "TEXT")
    private String materialsNeededVi;

    @Column(name = "textbook_pages")
    private String textbookPages;

    @Column(name = "powerpoint_url")
    private String powerpointUrl;

    @Column(name = "powerpoint_name")
    private String powerpointName;

    @Column(name = "worksheet_url")
    private String worksheetUrl;

    @Column(name = "worksheet_name")
    private String worksheetName;

    @Column(name = "video_url")
    private String videoUrl;

    @Column(name = "audio_url")
    private String audioUrl;

    @Column(name = "additional_resources", columnDefinition = "TEXT")
    private String additionalResources;

    // ============ ASSESSMENT & HOMEWORK ============

    @Column(name = "assessment_method", columnDefinition = "TEXT")
    private String assessmentMethod;

    @Column(name = "assessment_method_vi", columnDefinition = "TEXT")
    private String assessmentMethodVi;

    @Column(name = "homework_description", columnDefinition = "TEXT")
    private String homeworkDescription;

    @Column(name = "homework_description_vi", columnDefinition = "TEXT")
    private String homeworkDescriptionVi;

    @Column(name = "homework_due_date")
    private LocalDate homeworkDueDate;

    // ============ DIFFERENTIATION ============

    @Column(name = "differentiation_notes", columnDefinition = "TEXT")
    private String differentiationNotes;

    @Column(name = "advanced_learners_notes", columnDefinition = "TEXT")
    private String advancedLearnersNotes;

    @Column(name = "struggling_learners_notes", columnDefinition = "TEXT")
    private String strugglingLearnersNotes;

    // ============ REFLECTION ============

    @Column(name = "teacher_reflection", columnDefinition = "TEXT")
    private String teacherReflection;

    @Column(name = "teacher_reflection_vi", columnDefinition = "TEXT")
    private String teacherReflectionVi;

    @Column(name = "what_went_well", columnDefinition = "TEXT")
    private String whatWentWell;

    @Column(name = "areas_for_improvement", columnDefinition = "TEXT")
    private String areasForImprovement;

    // ============ STATUS & METADATA ============

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT, SUBMITTED, APPROVED, IN_PROGRESS, COMPLETED

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
