package com.lera.connect_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "parent_teacher_meetings", indexes = {
    @Index(name = "idx_ptm_teacher", columnList = "teacher_id"),
    @Index(name = "idx_ptm_parent", columnList = "parent_id"),
    @Index(name = "idx_ptm_student", columnList = "student_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParentTeacherMeeting {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "teacher_id", nullable = false)
    private UUID teacherId;

    @Column(name = "parent_id", nullable = false)
    private UUID parentId;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "academy_id")
    private UUID academyId;

    @Column(name = "conversation_id")
    private UUID conversationId; // If scheduled from chat

    @Column(name = "meeting_type", length = 30)
    @Builder.Default
    private String meetingType = "IN_PERSON"; // IN_PERSON, VIDEO_CALL, PHONE_CALL

    @Column(name = "meeting_link", columnDefinition = "TEXT")
    private String meetingLink; // For video calls

    @Column(name = "location")
    private String location; // For in-person

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Column(name = "duration_minutes")
    @Builder.Default
    private Integer durationMinutes = 30;

    @Column(name = "status", length = 20)
    @Builder.Default
    private String status = "PENDING"; // PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW

    @Column(name = "subject")
    private String subject;

    @Column(name = "agenda", columnDefinition = "TEXT")
    private String agenda;

    @Column(name = "teacher_notes", columnDefinition = "TEXT")
    private String teacherNotes;

    @Column(name = "parent_notes", columnDefinition = "TEXT")
    private String parentNotes;

    @Column(name = "outcome", columnDefinition = "TEXT")
    private String outcome;

    @Column(name = "follow_up_required")
    @Builder.Default
    private Boolean followUpRequired = false;

    @Column(name = "follow_up_date")
    private LocalDateTime followUpDate;

    @Column(name = "reminder_sent")
    @Builder.Default
    private Boolean reminderSent = false;

    @Column(name = "requested_by", length = 20)
    @Builder.Default
    private String requestedBy = "TEACHER"; // TEACHER, PARENT

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
