package com.lera.rule_engine.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "rule_executions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RuleExecution {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "rule_id", nullable = false)
    private UUID ruleId;
    
    @Column(name = "trigger_type")
    private String triggerType; // MANUAL, SCHEDULED, EVENT
    
    @Column(name = "trigger_event")
    private String triggerEvent; // ENROLLMENT_CREATED, ATTENDANCE_MARKED, PAYMENT_RECEIVED, LEAVE_APPLIED
    
    @Column(name = "context_data", columnDefinition = "TEXT")
    private String contextData; // JSON data used for evaluation
    
    @Column(name = "condition_result")
    private Boolean conditionResult;
    
    @Column(name = "action_executed")
    @Builder.Default
    private Boolean actionExecuted = false;
    
    @Column(name = "action_result", columnDefinition = "TEXT")
    private String actionResult;
    
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
    
    @Column(name = "execution_time_ms")
    private Long executionTimeMs;
    
    @Column(name = "executed_by")
    private UUID executedBy;
    
    @Column(name = "executed_at")
    @Builder.Default
    private LocalDateTime executedAt = LocalDateTime.now();
}
