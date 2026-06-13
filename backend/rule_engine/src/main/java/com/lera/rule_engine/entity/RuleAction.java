package com.lera.rule_engine.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "rule_actions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RuleAction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "rule_id", nullable = false)
    private UUID ruleId;
    
    @Column(name = "action_type", nullable = false)
    private String actionType; // APPLY_DISCOUNT, SEND_NOTIFICATION, SEND_EMAIL, APPROVE, REJECT, ESCALATE, UPDATE_STATUS
    
    @Column(name = "action_params", columnDefinition = "TEXT")
    private String actionParams; // JSON parameters for the action
    
    @Column(name = "notification_template")
    private String notificationTemplate;
    
    @Column(name = "recipient_type")
    private String recipientType; // STUDENT, PARENT, TEACHER, ADMIN, SPECIFIC_USER
    
    @Column(name = "recipient_id")
    private UUID recipientId;
    
    @Column(name = "sequence_order")
    @Builder.Default
    private Integer sequenceOrder = 0;
    
    @Column(name = "is_async")
    @Builder.Default
    private Boolean isAsync = false;
    
    @Column(name = "retry_count")
    @Builder.Default
    private Integer retryCount = 0;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
