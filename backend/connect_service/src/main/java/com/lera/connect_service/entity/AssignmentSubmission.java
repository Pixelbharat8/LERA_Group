package com.lera.connect_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
// Submissions to connect's chat-shared assignments (shared_assignments, UUID id). Kept in a
// SEPARATE table from academy's Long-keyed `assignment_submissions` — mapping both to the same
// table name made connect's assignment_id (UUID) collide with academy's (bigint), so on a fresh
// prod deploy academy's FK migration flips the column to bigint and breaks connect at runtime.
@Table(name = "shared_assignment_submissions", indexes = {
    @Index(name = "idx_shared_submission_assignment", columnList = "assignment_id"),
    @Index(name = "idx_shared_submission_student", columnList = "student_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentSubmission {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "assignment_id", nullable = false)
    private UUID assignmentId;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "parent_notified_id")
    private UUID parentNotifiedId;

    @Column(name = "submission_text", columnDefinition = "TEXT")
    private String submissionText;

    @Column(name = "attachment_urls", columnDefinition = "TEXT")
    private String attachmentUrls; // JSON array

    @Column(name = "status", length = 20)
    @Builder.Default
    private String status = "SUBMITTED"; // SUBMITTED, GRADED, RETURNED, LATE

    @Column(name = "score")
    private Integer score;

    @Column(name = "grade", length = 10)
    private String grade;

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "graded_by_id")
    private UUID gradedById;

    @Column(name = "graded_at")
    private LocalDateTime gradedAt;

    @Column(name = "is_late")
    @Builder.Default
    private Boolean isLate = false;

    @Column(name = "submitted_at", nullable = false)
    @Builder.Default
    private LocalDateTime submittedAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
