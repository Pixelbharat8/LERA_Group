package com.lera.rule_engine.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "rule_conditions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RuleCondition {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "rule_id", nullable = false)
    private UUID ruleId;
    
    @Column(name = "field_name", nullable = false)
    private String fieldName; // e.g., "student.attendanceRate", "payment.amount", "leave.days"
    
    @Column(name = "operator", nullable = false)
    private String operator; // EQUALS, NOT_EQUALS, GREATER_THAN, LESS_THAN, CONTAINS, IN, BETWEEN
    
    @Column(name = "field_value", nullable = false)
    private String fieldValue; // The value to compare against
    
    @Column(name = "value_type")
    @Builder.Default
    private String valueType = "STRING"; // STRING, NUMBER, DATE, BOOLEAN, LIST
    
    @Column(name = "logical_operator")
    @Builder.Default
    private String logicalOperator = "AND"; // AND, OR - how to combine with next condition
    
    @Column(name = "sequence_order")
    @Builder.Default
    private Integer sequenceOrder = 0;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
