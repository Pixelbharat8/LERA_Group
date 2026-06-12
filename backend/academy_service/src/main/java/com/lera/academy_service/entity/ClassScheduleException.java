package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "class_schedule_exceptions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassScheduleException {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "class_id", nullable = false)
    private UUID classId;

    @Column(name = "schedule_id")
    private UUID scheduleId;

    @Column(name = "exception_date", nullable = false)
    private LocalDate exceptionDate;

    @Column(name = "exception_type", nullable = false)
    private String exceptionType; // CANCELLED, RESCHEDULED, ROOM_CHANGE, TEACHER_CHANGE

    @Column(name = "original_start_time")
    private LocalTime originalStartTime;

    @Column(name = "original_end_time")
    private LocalTime originalEndTime;

    @Column(name = "new_start_time")
    private LocalTime newStartTime;

    @Column(name = "new_end_time")
    private LocalTime newEndTime;

    @Column(name = "new_room_number")
    private String newRoomNumber;

    @Column(name = "new_teacher_id")
    private UUID newTeacherId;

    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "students_notified")
    @Builder.Default
    private Boolean studentsNotified = false;

    @Column(name = "notification_sent_at")
    private LocalDate notificationSentAt;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "created_at")
    private LocalDate createdAt;
}
