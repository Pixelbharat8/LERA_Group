package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transport_attendance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransportAttendance {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "id", columnDefinition = "VARCHAR(36)")
    private UUID id;

    @Column(name = "student_transport_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID studentTransportId;

    @Column(name = "schedule_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID scheduleId;

    @Column(name = "attendance_date", nullable = false)
    private LocalDateTime attendanceDate;

    @Column(name = "stop_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID stopId;

    @Column(name = "boarding_time")
    private LocalDateTime boardingTime;

    @Column(name = "alighting_time")
    private LocalDateTime alightingTime;

    @Column(name = "status", nullable = false, length = 20)
    private String status; // BOARDED, ABSENT, LATE, SKIPPED

    @Column(name = "boarding_latitude")
    private Double boardingLatitude;

    @Column(name = "boarding_longitude")
    private Double boardingLongitude;

    @Column(name = "alighting_latitude")
    private Double alightingLatitude;

    @Column(name = "alighting_longitude")
    private Double alightingLongitude;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "marked_by", columnDefinition = "VARCHAR(36)")
    private UUID markedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
