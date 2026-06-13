package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "class_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "class_id", nullable = false)
    private UUID classId;

    @Column(name = "module_id")
    private Long moduleId;

    @Column(name = "lesson_id")
    private Long lessonId;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "topic", nullable = false)
    private String topic;

    @Column(name = "topic_vi")
    private String topicVi;

    @Column(name = "objectives", columnDefinition = "TEXT")
    private String objectives;

    @Column(name = "room_number")
    private String roomNumber;

    @Column(name = "is_online")
    @Builder.Default
    private Boolean isOnline = false;

    @Column(name = "meeting_link")
    private String meetingLink;

    @Column(name = "teacher_id")
    private UUID teacherId;

    @Column(name = "substitute_teacher_id")
    private UUID substituteTeacherId;

    @Column(name = "status", nullable = false)
    private String status; // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED

    @Column(name = "actual_start_time")
    private LocalTime actualStartTime;

    @Column(name = "actual_end_time")
    private LocalTime actualEndTime;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "homework_assigned", columnDefinition = "TEXT")
    private String homeworkAssigned;
}
