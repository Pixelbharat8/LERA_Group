package com.lera.attendance_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.UUID;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * Teacher Session Record
 * Tracks when teachers teach classes for payroll calculation
 */
@Entity
@Table(name = "teacher_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherSession {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "teacher_id", nullable = false)
    private UUID teacherId;
    
    @Column(name = "class_id")
    private UUID classId;

    /** Academy {@code class_sessions.id} — set when synced from LMS session completion. */
    @Column(name = "class_session_id")
    private UUID classSessionId;
    
    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;
    
    @Column(name = "start_time")
    private LocalDateTime startTime;
    
    @Column(name = "end_time")
    private LocalDateTime endTime;
    
    @Column(name = "duration_hours", precision = 5, scale = 2)
    @PositiveOrZero
    private BigDecimal durationHours;
    
    @Column(name = "session_type", length = 30)
    @Builder.Default
    private String sessionType = "REGULAR"; // REGULAR, MAKEUP, TRIAL, EXTRA
    
    @Column(name = "status", length = 20)
    @Builder.Default
    private String status = "COMPLETED"; // SCHEDULED, COMPLETED, CANCELLED, NO_SHOW
    
    @Column(name = "students_attended")
    private Integer studentsAttended;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @PrePersist
    protected void onCreate() {
        if (durationHours == null && startTime != null && endTime != null) {
            long minutes = java.time.Duration.between(startTime, endTime).toMinutes();
            durationHours = BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 2, java.math.RoundingMode.HALF_UP);
        }
    }
}
