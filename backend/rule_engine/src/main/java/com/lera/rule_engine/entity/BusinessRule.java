package com.lera.rule_engine.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "business_rules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessRule {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "rule_name", nullable = false)
    private String ruleName;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "rule_type", nullable = false)
    private String ruleType; // FEE_DISCOUNT, ATTENDANCE_ALERT, LEAVE_APPROVAL, ENROLLMENT, PROMOTION, SCHOLARSHIP
    
    @Column(name = "category")
    private String category; // ACADEMIC, FINANCIAL, HR, ATTENDANCE, ENROLLMENT
    
    @Column(name = "condition_expression", columnDefinition = "TEXT")
    private String conditionExpression; // JSON expression for conditions
    
    @Column(name = "action_type")
    private String actionType; // APPLY_DISCOUNT, SEND_NOTIFICATION, APPROVE, REJECT, ESCALATE
    
    @Column(name = "action_params", columnDefinition = "TEXT")
    private String actionParams; // JSON params for action
    
    @Column(name = "priority")
    @Builder.Default
    private Integer priority = 0; // Higher priority rules execute first
    
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "academy_id")
    private UUID academyId;
    
    @Column(name = "tenant_id")
    private UUID tenantId;
    
    @Column(name = "effective_from")
    private LocalDateTime effectiveFrom;
    
    @Column(name = "effective_until")
    private LocalDateTime effectiveUntil;
    
    @Column(name = "created_by")
    private UUID createdBy;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
