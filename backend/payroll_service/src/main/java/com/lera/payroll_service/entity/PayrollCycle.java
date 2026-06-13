package com.lera.payroll_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payroll_cycles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollCycle {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "cycle_name", nullable = false, length = 100)
    private String cycleName; // "January 2024", "Q1 2024"

    @Column(name = "cycle_type", length = 50)
    @Builder.Default
    private String cycleType = "MONTHLY"; // WEEKLY, BI_WEEKLY, MONTHLY, QUARTERLY

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(length = 50)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT, CALCULATED, APPROVED, PROCESSED, PAID

    @Column(name = "total_employees")
    @Builder.Default
    private Integer totalEmployees = 0;

    @Column(name = "total_gross_salary", precision = 15, scale = 2)
    @Builder.Default
    private java.math.BigDecimal totalGrossSalary = java.math.BigDecimal.ZERO;

    @Column(name = "total_deductions", precision = 15, scale = 2)
    @Builder.Default
    private java.math.BigDecimal totalDeductions = java.math.BigDecimal.ZERO;

    @Column(name = "total_net_salary", precision = 15, scale = 2)
    @Builder.Default
    private java.math.BigDecimal totalNetSalary = java.math.BigDecimal.ZERO;

    @Column(name = "calculated_by")
    private UUID calculatedBy;

    @Column(name = "calculated_at")
    private LocalDateTime calculatedAt;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

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
