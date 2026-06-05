package com.lera.payroll_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "payroll")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "teacher_id")
    private UUID teacherId;
    
    @Column(name = "pay_period_start", nullable = false)
    private LocalDate payPeriodStart;
    
    @Column(name = "pay_period_end", nullable = false)
    private LocalDate payPeriodEnd;
    
    @Column(name = "base_salary", precision = 12, scale = 2)
    @Positive
    private BigDecimal baseSalary;
    
    @Column(name = "teaching_hours", precision = 6, scale = 2)
    @PositiveOrZero
    private BigDecimal teachingHours;
    
    @Column(name = "hourly_rate", precision = 10, scale = 2)
    @Positive
    private BigDecimal hourlyRate;
    
    @Column(name = "teaching_amount", precision = 12, scale = 2)
    @PositiveOrZero
    private BigDecimal teachingAmount;
    
    @Column(precision = 12, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal bonus = BigDecimal.ZERO;
    
    @Column(precision = 12, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal deductions = BigDecimal.ZERO;
    
    @Column(name = "total_amount", precision = 12, scale = 2)
    @PositiveOrZero
    private BigDecimal totalAmount;
    
    @Column(name = "center_id")
    private UUID centerId;
    
    @Column(name = "teacher_name")
    private String teacherName;
    
    @Column(name = "center_name")
    private String centerName;
    
    @Column(length = 10)
    @Builder.Default
    private String currency = "VND";
    
    @Column(length = 30)
    @Builder.Default
    private String status = "PENDING";
    
    @Column(name = "paid_at")
    private LocalDateTime paidAt;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "approved_by")
    private UUID approvedBy;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @PrePersist
    protected void calculateTotalAmount() {
        if (teachingAmount == null && teachingHours != null && hourlyRate != null) {
            teachingAmount = hourlyRate.multiply(teachingHours);
        }
        BigDecimal gross = (baseSalary != null ? baseSalary : BigDecimal.ZERO)
                .add(teachingAmount != null ? teachingAmount : BigDecimal.ZERO)
                .add(bonus != null ? bonus : BigDecimal.ZERO);
        BigDecimal totalDeductions = (deductions != null ? deductions : BigDecimal.ZERO);
        // Clamp to zero: net pay can never be negative. Deductions exceeding gross would
        // otherwise persist a negative "salary owed by employee" and could be paid out as a
        // negative payout. (@PositiveOrZero does not run on @PrePersist-computed values.)
        totalAmount = gross.subtract(totalDeductions).max(BigDecimal.ZERO);
    }
}
