package com.lera.payroll_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "teacher_overtime", indexes = {
    @Index(name = "idx_teacher_overtime_teacher", columnList = "teacher_id"),
    @Index(name = "idx_teacher_overtime_date", columnList = "overtime_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherOvertime {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "teacher_id", nullable = false)
    private UUID teacherId;

    @Column(name = "overtime_date", nullable = false)
    private LocalDate overtimeDate;

    @Column(name = "start_time")
    private java.time.LocalTime startTime;

    @Column(name = "end_time")
    private java.time.LocalTime endTime;

    @Column(name = "hours_worked", precision = 5, scale = 2)
    @PositiveOrZero
    private BigDecimal hoursWorked;

    @Column(name = "overtime_type", length = 50)
    private String overtimeType; // REGULAR, WEEKEND, HOLIDAY

    @Column(name = "hourly_rate", precision = 10, scale = 2)
    @Positive
    private BigDecimal hourlyRate;

    @Column(name = "total_amount", precision = 12, scale = 2)
    @PositiveOrZero
    private BigDecimal totalAmount;

    @Column(name = "multiplier", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal multiplier = new BigDecimal("1.5"); // 1.5x for overtime, 2x for holidays

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(length = 50)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, PAID

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(columnDefinition = "TEXT")
    private String notes;

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
