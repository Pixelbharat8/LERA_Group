package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sport_training_sessions", indexes = {
    @Index(name = "idx_training_sessions_team", columnList = "team_id"),
    @Index(name = "idx_training_sessions_date", columnList = "session_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportTrainingSession {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    @Column(name = "coach_id")
    private UUID coachId;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(name = "start_time")
    private java.time.LocalTime startTime;

    @Column(name = "end_time")
    private java.time.LocalTime endTime;

    @Column(length = 200)
    private String venue;

    @Column(name = "session_type", length = 50)
    private String sessionType; // TECHNIQUE, FITNESS, TACTICAL, MATCH_SIMULATION, RECOVERY

    @Column(name = "focus_area", columnDefinition = "TEXT")
    private String focusArea; // What will be practiced

    @Column(name = "drills", columnDefinition = "TEXT")
    private String drills; // JSON array of drills

    @Column(name = "attendance_count")
    @Builder.Default
    private Integer attendanceCount = 0;

    @Column(name = "total_invited")
    @Builder.Default
    private Integer totalInvited = 0;

    @Column(length = 50)
    @Builder.Default
    private String status = "SCHEDULED"; // SCHEDULED, COMPLETED, CANCELLED

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "performance_notes", columnDefinition = "TEXT")
    private String performanceNotes;

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
