package com.lera.connect_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_tutor_sessions", indexes = {
    @Index(name = "idx_ai_tutor_student", columnList = "student_id"),
    @Index(name = "idx_ai_tutor_conversation", columnList = "conversation_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiTutorSession {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "conversation_id")
    private UUID conversationId; // Chat context

    @Column(name = "academy_id")
    private UUID academyId;

    @Column(name = "subject")
    private String subject;

    @Column(name = "topic")
    private String topic;

    @Column(name = "grade_level")
    private String gradeLevel;

    @Column(name = "session_type", length = 30)
    @Builder.Default
    private String sessionType = "HELP"; // HELP, EXPLAIN, QUIZ, PRACTICE, HOMEWORK_HELP

    @Column(name = "difficulty_level", length = 20)
    @Builder.Default
    private String difficultyLevel = "MEDIUM"; // EASY, MEDIUM, HARD, ADAPTIVE

    @Column(name = "question", columnDefinition = "TEXT")
    private String question;

    @Column(name = "ai_response", columnDefinition = "TEXT")
    private String aiResponse;

    @Column(name = "context_messages", columnDefinition = "TEXT")
    private String contextMessages; // JSON array of previous messages

    @Column(name = "learning_objective", columnDefinition = "TEXT")
    private String learningObjective;

    @Column(name = "feedback_rating")
    private Integer feedbackRating; // 1-5 stars

    @Column(name = "feedback_text", columnDefinition = "TEXT")
    private String feedbackText;

    @Column(name = "tokens_used")
    private Integer tokensUsed;

    @Column(name = "model_used")
    private String modelUsed;

    @Column(name = "parent_visible")
    @Builder.Default
    private Boolean parentVisible = true;

    @Column(name = "teacher_visible")
    @Builder.Default
    private Boolean teacherVisible = true;

    @Column(name = "is_completed")
    @Builder.Default
    private Boolean isCompleted = false;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
