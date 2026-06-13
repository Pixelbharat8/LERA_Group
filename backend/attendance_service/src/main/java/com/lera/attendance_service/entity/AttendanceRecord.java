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
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @PreUpdate
    protected void onUpdate() {
        createdAt = LocalDateTime.now();
    }
}
