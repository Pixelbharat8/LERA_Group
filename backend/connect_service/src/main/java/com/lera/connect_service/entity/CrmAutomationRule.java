package com.lera.connect_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_automation_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmAutomationRule {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "automation_id", nullable = false)
    private UUID automationId;

    @Column(name = "rule_name")
    private String ruleName;

    @Column(name = "rule_order")
    @Builder.Default
    private Integer ruleOrder = 0;

    @Column(name = "condition_type", length = 50)
    private String conditionType; // IF, AND, OR

    @Column(name = "condition_field", length = 100)
    private String conditionField; // status, source, email_opened, etc.

    @Column(name = "condition_operator", length = 50)
    private String conditionOperator; // EQUALS, NOT_EQUALS, CONTAINS, GREATER_THAN, etc.

    @Column(name = "condition_value", columnDefinition = "TEXT")
    private String conditionValue;

    @Column(name = "action_type", length = 50)
    private String actionType; // SEND_EMAIL, UPDATE_FIELD, ASSIGN_TO_USER, CREATE_TASK, etc.

    @Column(name = "action_data", columnDefinition = "TEXT")
    private String actionData; // JSON

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
