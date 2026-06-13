package com.lera.academy_service.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;

@Entity
@Table(
        name = "session_attendance",
        indexes = {
            @Index(name = "idx_session_attendance_session", columnList = "session_id"),
            @Index(name = "idx_session_attendance_student", columnList = "student_id")
        })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "status", nullable = false)
    private String status; // PRESENT, ABSENT, LATE, EXCUSED

    @Column(name = "check_in_time")
    private LocalDateTime checkInTime;

    @Column(name = "check_out_time")
    private LocalDateTime checkOutTime;

    @Column(name = "minutes_late")
    private Integer minutesLate;

    @Column(name = "participation_score")
    private Integer participationScore;

    @Column(name = "behavior_score")
    private Integer behaviorScore;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "parent_notified")
    @Builder.Default
    private Boolean parentNotified = false;

    @Column(name = "parent_notified_at")
    private LocalDateTime parentNotifiedAt;

    @Column(name = "recorded_by")
    private UUID recordedBy;

    @Column(name = "recorded_at")
    private LocalDateTime recordedAt;
}
