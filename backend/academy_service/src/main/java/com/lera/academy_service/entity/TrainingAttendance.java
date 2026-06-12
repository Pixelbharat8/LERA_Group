package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "training_attendance", indexes = {
    @Index(name = "idx_training_attendance_session", columnList = "training_session_id"),
    @Index(name = "idx_training_attendance_player", columnList = "player_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainingAttendance {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "training_session_id", nullable = false)
    private UUID trainingSessionId;

    @Column(name = "player_id", nullable = false)
    private UUID playerId;

    @Column(length = 50)
    @Builder.Default
    private String status = "PRESENT"; // PRESENT, ABSENT, LATE, EXCUSED, INJURED

    @Column(name = "check_in_time")
    private java.time.LocalTime checkInTime;

    @Column(name = "check_out_time")
    private java.time.LocalTime checkOutTime;

    @Column(name = "performance_rating", precision = 3, scale = 1)
    private java.math.BigDecimal performanceRating; // Out of 10

    @Column(name = "injury_reported")
    @Builder.Default
    private Boolean injuryReported = false;

    @Column(name = "injury_details", columnDefinition = "TEXT")
    private String injuryDetails;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "marked_by")
    private UUID markedBy;

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
