package com.lera.attendance_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Monthly Leave Accrual System
 * Each user gets 1 leave per month = 12 leaves per year
 */
@Entity
@Table(name = "leave_balance_accruals", indexes = {
    @Index(name = "idx_lba_user", columnList = "user_id"),
    @Index(name = "idx_lba_year_month", columnList = "year,month"),
    @Index(name = "idx_lba_user_year", columnList = "user_id,year")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveBalanceAccrual {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "center_id", nullable = false)
    private UUID centerId;

    @Column(name = "year", nullable = false)
    private Integer year; // 2025

    @Column(name = "month", nullable = false)
    private Integer month; // 1-12 (January = 1)

    @Column(name = "leaves_accrued")
    @Builder.Default
    private Double leavesAccrued = 1.0; // 1 leave per month

    @Column(name = "leaves_used")
    @Builder.Default
    private Double leavesUsed = 0.0; // How many leaves used this month

    @Column(name = "leaves_carried_forward")
    @Builder.Default
    private Double leavesCarriedForward = 0.0; // Unused leaves from previous months

    @Column(name = "total_available")
    @Builder.Default
    private Double totalAvailable = 1.0; // accrued + carried forward - used

    @Column(name = "accrual_date", nullable = false)
    private LocalDate accrualDate; // First day of the month

    @Column(name = "is_processed")
    @Builder.Default
    private Boolean isProcessed = true; // Has monthly accrual been processed

    @Column(name = "notes", columnDefinition = "TEXT")
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

    // Calculate total available leaves
    public void calculateTotalAvailable() {
        this.totalAvailable = this.leavesAccrued + this.leavesCarriedForward - this.leavesUsed;
    }
}
