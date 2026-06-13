package com.lera.connect_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "shared_assignments", indexes = {
    @Index(name = "idx_shared_assignment_conversation", columnList = "conversation_id"),
    @Index(name = "idx_shared_assignment_class", columnList = "class_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SharedAssignment {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "conversation_id", nullable = false)
    private UUID conversationId;

    @Column(name = "class_id")
    private UUID classId;

    @Column(name = "shared_by_id", nullable = false)
    private UUID sharedById;

    @Column(name = "assignment_type", length = 30)
    @Builder.Default
    private String assignmentType = "HOMEWORK"; // HOMEWORK, CLASSWORK, PROJECT, EXAM, QUIZ

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "subject")
    private String subject;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "max_score")
    private Integer maxScore;

    @Column(name = "attachment_urls", columnDefinition = "TEXT")
    private String attachmentUrls; // JSON array of URLs

    @Column(name = "instructions", columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "allow_late_submission")
    @Builder.Default
    private Boolean allowLateSubmission = false;

    @Column(name = "late_penalty_percent")
    private Integer latePenaltyPercent;

    @Column(name = "is_published")
    @Builder.Default
    private Boolean isPublished = true;

    @Column(name = "notify_parents")
    @Builder.Default
    private Boolean notifyParents = true;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
