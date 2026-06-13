package com.lera.payroll_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "teacher_salaries", indexes = {
    @Index(name = "idx_teacher_salaries_cycle", columnList = "payroll_cycle_id"),
    @Index(name = "idx_teacher_salaries_teacher", columnList = "teacher_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherSalary {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "payroll_cycle_id", nullable = false)
    private UUID payrollCycleId;

    @Column(name = "teacher_id", nullable = false)
    private UUID teacherId;

    @Column(name = "base_salary", precision = 12, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal baseSalary = BigDecimal.ZERO;

    @Column(name = "classes_taught")
    @Builder.Default
    private Integer classesTaught = 0;

    @Column(name = "hourly_rate", precision = 10, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal hourlyRate = BigDecimal.ZERO;

    @Column(name = "total_hours", precision = 8, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal totalHours = BigDecimal.ZERO;

    @Column(name = "overtime_hours", precision = 8, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal overtimeHours = BigDecimal.ZERO;

    @Column(name = "overtime_pay", precision = 12, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal overtimePay = BigDecimal.ZERO;

    @Column(name = "bonus", precision = 12, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal bonus = BigDecimal.ZERO;

    @Column(name = "allowances", precision = 12, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal allowances = BigDecimal.ZERO;

    @Column(name = "gross_salary", precision = 12, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal grossSalary = BigDecimal.ZERO;

    @Column(name = "tax_deduction", precision = 12, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal taxDeduction = BigDecimal.ZERO;

    @Column(name = "provident_fund", precision = 12, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal providentFund = BigDecimal.ZERO;

    @Column(name = "insurance", precision = 12, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal insurance = BigDecimal.ZERO;

    @Column(name = "other_deductions", precision = 12, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal otherDeductions = BigDecimal.ZERO;

    @Column(name = "total_deductions", precision = 12, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal totalDeductions = BigDecimal.ZERO;

    @Column(name = "net_salary", precision = 12, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal netSalary = BigDecimal.ZERO;

    @Column(length = 50)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, PAID

    @Column(name = "payment_date")
    private java.time.LocalDate paymentDate;

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
