package com.lera.payment_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "late_fee_rules")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LateFeeRule {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(name = "center_id")
    private UUID centerId;
    
    @Column(name = "rule_name")
    private String ruleName;
    
    @Column(name = "days_after_due")
    private Integer daysAfterDue;
    
    @Column(name = "fee_type")
    private String feeType; // PERCENTAGE, FIXED
    
    @Column(name = "fee_value")
    @PositiveOrZero
    private BigDecimal feeValue;
    
    @Column(name = "compound_interest")
    private Boolean compoundInterest = false;
    
    @Column(name = "grace_period_days")
    private Integer gracePeriodDays = 0;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "created_at")
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
