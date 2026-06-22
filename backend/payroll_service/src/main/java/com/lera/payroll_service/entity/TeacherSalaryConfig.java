package com.lera.payroll_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * Teacher Salary Configuration
 * Stores salary rules per teacher
 */
@Entity
@Table(name = "teacher_salary_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherSalaryConfig {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "teacher_id", nullable = false, unique = true)
    private UUID teacherId;
    
    @Column(name = "center_id")
    private UUID centerId;
    
    @Column(name = "base_salary", precision = 12, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal baseSalary = BigDecimal.ZERO;
    
    @Column(name = "hourly_rate", precision = 10, scale = 2)
    @Builder.Default
    @Positive
    private BigDecimal hourlyRate = new BigDecimal("200000"); // 200K VND per hour
    
    @Column(name = "session_rate", precision = 10, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal sessionRate = BigDecimal.ZERO;

    // Contracted hours per pay period — used to compute hourly pay for NON-teaching staff,
    // who have no teaching-session record to derive hours from.
    @Column(name = "standard_hours", precision = 8, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal standardHours = BigDecimal.ZERO;
    
    @Column(name = "salary_type", length = 20)
    @Builder.Default
    private String salaryType = "HOURLY"; // FIXED, HOURLY, SESSION, HYBRID
    
    @Column(name = "currency", length = 10)
    @Builder.Default
    private String currency = "VND";
    
    @Column(name = "effective_from")
    private LocalDateTime effectiveFrom;
    
    @Column(name = "effective_to")
    private LocalDateTime effectiveTo;
    
    @Column(name = "status", length = 20)
    @Builder.Default
    private String status = "ACTIVE";
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
