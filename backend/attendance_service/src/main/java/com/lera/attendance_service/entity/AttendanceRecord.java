package com.lera.attendance_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "attendance")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "session_id")
    private UUID sessionId;
    
    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    // Not persisted — populated on list responses from the shared students table so the UI can
    // show/filter by name instead of a bare studentId UUID (see AttendanceController.withNames).
    @Transient
    private String studentName;

    @Column(name = "center_id")
    private UUID centerId;
    
    @Column(length = 20)
    @Builder.Default
    private String status = "PRESENT"; // PRESENT, ABSENT, LATE, EXCUSED
    
    @Column(name = "check_in_time")
    private LocalDateTime checkInTime;
    
    @Column(name = "check_out_time")
    private LocalDateTime checkOutTime;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "marked_by")
    private UUID markedBy;
    
    // Immutable: created_at is the field reports bucket by (year/month/day), so it
    // must never move. updatable=false keeps it out of every UPDATE, and there is
    // deliberately no @PreUpdate rewriting it (that corrupted report dates on edit).
    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) this.createdAt = now;
    }
}
