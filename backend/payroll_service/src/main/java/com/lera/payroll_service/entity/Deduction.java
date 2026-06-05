package com.lera.payroll_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "deductions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Deduction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "teacher_id", nullable = false)
    private Long teacherId;

    @Column(name = "payroll_cycle_id")
    private Long payrollCycleId;

    @Column(name = "deduction_type", length = 100)
    private String deductionType;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "status", length = 50)
    @Builder.Default
    private String status = "APPLIED";

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
