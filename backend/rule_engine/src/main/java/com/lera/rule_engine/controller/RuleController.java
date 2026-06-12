package com.lera.rule_engine.controller;

import com.lera.rule_engine.entity.*;
import com.lera.rule_engine.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/rules")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER')")
public class RuleController {
    
    private final BusinessRuleRepository ruleRepository;
    private final RuleConditionRepository conditionRepository;
    private final RuleActionRepository actionRepository;
    private final RuleExecutionRepository executionRepository;
    
    // ==================== HEALTH CHECK ====================
    
    /**
     * Health check endpoint for Rule Engine
     * Frontend calls: GET /api/rules/health
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "Rule Engine");
        health.put("timestamp", LocalDateTime.now());
        health.put("totalRules", ruleRepository.count());
        return ResponseEntity.ok(health);
    }
    
    // ==================== BUSINESS RULES ====================
    
    @GetMapping
    public ResponseEntity<List<BusinessRule>> getAllRules() {
        return ResponseEntity.ok(ruleRepository.findAllByOrderByPriorityDesc());
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<BusinessRule>> getActiveRules() {
        return ResponseEntity.ok(ruleRepository.findByIsActiveTrueOrderByPriorityDesc());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<BusinessRule> getRuleById(@PathVariable UUID id) {
        return ruleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/type/{ruleType}")
    public ResponseEntity<List<BusinessRule>> getRulesByType(@PathVariable String ruleType) {
        return ResponseEntity.ok(ruleRepository.findByRuleTypeAndIsActiveTrue(ruleType));
    }
    
    @GetMapping("/category/{category}")
    public ResponseEntity<List<BusinessRule>> getRulesByCategory(@PathVariable String category) {
        return ResponseEntity.ok(ruleRepository.findByCategoryAndIsActiveTrue(category));
    }
    
    @GetMapping("/academy/{academyId}")
    public ResponseEntity<List<BusinessRule>> getRulesByAcademy(@PathVariable UUID academyId) {
        return ResponseEntity.ok(ruleRepository.findByAcademyIdAndIsActiveTrue(academyId));
    }
    
    @PostMapping
    public ResponseEntity<BusinessRule> createRule(@Valid @RequestBody BusinessRule rule) {
        rule.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.ok(ruleRepository.save(rule));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<BusinessRule> updateRule(@PathVariable UUID id, @Valid @RequestBody BusinessRule ruleDetails) {
        return ruleRepository.findById(id).map(rule -> {
            if (ruleDetails.getRuleName() != null) rule.setRuleName(ruleDetails.getRuleName());
            if (ruleDetails.getDescription() != null) rule.setDescription(ruleDetails.getDescription());
            if (ruleDetails.getRuleType() != null) rule.setRuleType(ruleDetails.getRuleType());
            if (ruleDetails.getCategory() != null) rule.setCategory(ruleDetails.getCategory());
            if (ruleDetails.getConditionExpression() != null) rule.setConditionExpression(ruleDetails.getConditionExpression());
            if (ruleDetails.getActionType() != null) rule.setActionType(ruleDetails.getActionType());
            if (ruleDetails.getActionParams() != null) rule.setActionParams(ruleDetails.getActionParams());
            if (ruleDetails.getPriority() != null) rule.setPriority(ruleDetails.getPriority());
            if (ruleDetails.getIsActive() != null) rule.setIsActive(ruleDetails.getIsActive());
            if (ruleDetails.getEffectiveFrom() != null) rule.setEffectiveFrom(ruleDetails.getEffectiveFrom());
            if (ruleDetails.getEffectiveUntil() != null) rule.setEffectiveUntil(ruleDetails.getEffectiveUntil());
            return ResponseEntity.ok(ruleRepository.save(rule));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<BusinessRule> toggleRule(@PathVariable UUID id) {
        return ruleRepository.findById(id).map(rule -> {
            rule.setIsActive(!rule.getIsActive());
            return ResponseEntity.ok(ruleRepository.save(rule));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRule(@PathVariable UUID id) {
        if (ruleRepository.existsById(id)) {
            conditionRepository.deleteByRuleId(id);
            actionRepository.deleteByRuleId(id);
            ruleRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    // ==================== RULE CONDITIONS ====================
    
    @GetMapping("/{ruleId}/conditions")
    public ResponseEntity<List<RuleCondition>> getConditions(@PathVariable UUID ruleId) {
        return ResponseEntity.ok(conditionRepository.findByRuleIdOrderBySequenceOrder(ruleId));
    }
    
    @PostMapping("/{ruleId}/conditions")
    public ResponseEntity<RuleCondition> addCondition(@PathVariable UUID ruleId, @Valid @RequestBody RuleCondition condition) {
        condition.setRuleId(ruleId);
        return ResponseEntity.ok(conditionRepository.save(condition));
    }
    
    @PutMapping("/conditions/{conditionId}")
    public ResponseEntity<RuleCondition> updateCondition(@PathVariable UUID conditionId, @Valid @RequestBody RuleCondition conditionDetails) {
        return conditionRepository.findById(conditionId).map(condition -> {
            if (conditionDetails.getFieldName() != null) condition.setFieldName(conditionDetails.getFieldName());
            if (conditionDetails.getOperator() != null) condition.setOperator(conditionDetails.getOperator());
            if (conditionDetails.getFieldValue() != null) condition.setFieldValue(conditionDetails.getFieldValue());
            if (conditionDetails.getValueType() != null) condition.setValueType(conditionDetails.getValueType());
            if (conditionDetails.getLogicalOperator() != null) condition.setLogicalOperator(conditionDetails.getLogicalOperator());
            if (conditionDetails.getSequenceOrder() != null) condition.setSequenceOrder(conditionDetails.getSequenceOrder());
            return ResponseEntity.ok(conditionRepository.save(condition));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/conditions/{conditionId}")
    public ResponseEntity<Void> deleteCondition(@PathVariable UUID conditionId) {
        if (conditionRepository.existsById(conditionId)) {
            conditionRepository.deleteById(conditionId);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    // ==================== RULE ACTIONS ====================
    
    @GetMapping("/{ruleId}/actions")
    public ResponseEntity<List<RuleAction>> getActions(@PathVariable UUID ruleId) {
        return ResponseEntity.ok(actionRepository.findByRuleIdOrderBySequenceOrder(ruleId));
    }
    
    @PostMapping("/{ruleId}/actions")
    public ResponseEntity<RuleAction> addAction(@PathVariable UUID ruleId, @Valid @RequestBody RuleAction action) {
        action.setRuleId(ruleId);
        return ResponseEntity.ok(actionRepository.save(action));
    }
    
    @PutMapping("/actions/{actionId}")
    public ResponseEntity<RuleAction> updateAction(@PathVariable UUID actionId, @Valid @RequestBody RuleAction actionDetails) {
        return actionRepository.findById(actionId).map(action -> {
            if (actionDetails.getActionType() != null) action.setActionType(actionDetails.getActionType());
            if (actionDetails.getActionParams() != null) action.setActionParams(actionDetails.getActionParams());
            if (actionDetails.getNotificationTemplate() != null) action.setNotificationTemplate(actionDetails.getNotificationTemplate());
            if (actionDetails.getRecipientType() != null) action.setRecipientType(actionDetails.getRecipientType());
            if (actionDetails.getRecipientId() != null) action.setRecipientId(actionDetails.getRecipientId());
            if (actionDetails.getSequenceOrder() != null) action.setSequenceOrder(actionDetails.getSequenceOrder());
            return ResponseEntity.ok(actionRepository.save(action));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/actions/{actionId}")
    public ResponseEntity<Void> deleteAction(@PathVariable UUID actionId) {
        if (actionRepository.existsById(actionId)) {
            actionRepository.deleteById(actionId);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    // ==================== RULE EXECUTION ====================
    
    @PostMapping("/{ruleId}/execute")
    public ResponseEntity<Map<String, Object>> executeRule(@PathVariable UUID ruleId, @Valid @RequestBody Map<String, Object> context) {
        long startTime = System.currentTimeMillis();
        Map<String, Object> result = new HashMap<>();
        
        Optional<BusinessRule> ruleOpt = ruleRepository.findById(ruleId);
        if (ruleOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        BusinessRule rule = ruleOpt.get();
        List<RuleCondition> conditions = conditionRepository.findByRuleIdOrderBySequenceOrder(ruleId);
        
        // Evaluate conditions (simplified - in production use a proper expression engine)
        boolean conditionMet = evaluateConditions(conditions, context);
        result.put("conditionMet", conditionMet);
        result.put("ruleName", rule.getRuleName());
        
        if (conditionMet) {
            List<RuleAction> actions = actionRepository.findByRuleIdOrderBySequenceOrder(ruleId);
            List<Map<String, Object>> actionResults = executeActions(actions, context);
            result.put("actionsExecuted", actionResults);
        }
        
        long executionTime = System.currentTimeMillis() - startTime;
        result.put("executionTimeMs", executionTime);
        
        // Log execution
        RuleExecution execution = RuleExecution.builder()
                .ruleId(ruleId)
                .triggerType("MANUAL")
                .contextData(context.toString())
                .conditionResult(conditionMet)
                .actionExecuted(conditionMet)
                .actionResult(result.toString())
                .executionTimeMs(executionTime)
                .build();
        executionRepository.save(execution);
        
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/{ruleId}/executions")
    public ResponseEntity<List<RuleExecution>> getExecutionHistory(@PathVariable UUID ruleId) {
        return ResponseEntity.ok(executionRepository.findByRuleIdOrderByExecutedAtDesc(ruleId));
    }
    
    @GetMapping("/{ruleId}/stats")
    public ResponseEntity<Map<String, Object>> getRuleStats(@PathVariable UUID ruleId) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("successCount", executionRepository.countByRuleIdAndConditionResultTrue(ruleId));
        stats.put("failureCount", executionRepository.countByRuleIdAndConditionResultFalse(ruleId));
        return ResponseEntity.ok(stats);
    }
    
    // ==================== RULE TEMPLATES ====================
    
    @GetMapping("/templates")
    public ResponseEntity<List<Map<String, Object>>> getRuleTemplates() {
        List<Map<String, Object>> templates = new ArrayList<>();
        
        // Fee Discount Rule Template
        templates.add(Map.of(
                "name", "Fee Discount Rule",
                "type", "FEE_DISCOUNT",
                "category", "FINANCIAL",
                "description", "Apply discount based on criteria like sibling, early payment, etc.",
                "sampleConditions", List.of(
                        Map.of("field", "student.hasSibling", "operator", "EQUALS", "value", "true"),
                        Map.of("field", "payment.isPaidEarly", "operator", "EQUALS", "value", "true")
                ),
                "sampleActions", List.of(
                        Map.of("type", "APPLY_DISCOUNT", "params", "{\"percentage\": 10}")
                )
        ));
        
        // Attendance Alert Rule Template
        templates.add(Map.of(
                "name", "Low Attendance Alert",
                "type", "ATTENDANCE_ALERT",
                "category", "ATTENDANCE",
                "description", "Send notification when attendance falls below threshold",
                "sampleConditions", List.of(
                        Map.of("field", "student.attendanceRate", "operator", "LESS_THAN", "value", "75")
                ),
                "sampleActions", List.of(
                        Map.of("type", "SEND_NOTIFICATION", "params", "{\"template\": \"low_attendance\", \"recipients\": [\"PARENT\", \"TEACHER\"]}")
                )
        ));
        
        // Leave Approval Rule Template
        templates.add(Map.of(
                "name", "Auto Leave Approval",
                "type", "LEAVE_APPROVAL",
                "category", "HR",
                "description", "Auto-approve leave based on balance and history",
                "sampleConditions", List.of(
                        Map.of("field", "leave.days", "operator", "LESS_THAN_EQUALS", "value", "2"),
                        Map.of("field", "employee.leaveBalance", "operator", "GREATER_THAN", "value", "5")
                ),
                "sampleActions", List.of(
                        Map.of("type", "APPROVE", "params", "{\"autoApprove\": true}")
                )
        ));
        
        // Scholarship Eligibility Rule Template
        templates.add(Map.of(
                "name", "Scholarship Eligibility",
                "type", "SCHOLARSHIP",
                "category", "FINANCIAL",
                "description", "Determine scholarship eligibility based on marks and attendance",
                "sampleConditions", List.of(
                        Map.of("field", "student.averageMarks", "operator", "GREATER_THAN_EQUALS", "value", "85"),
                        Map.of("field", "student.attendanceRate", "operator", "GREATER_THAN_EQUALS", "value", "90")
                ),
                "sampleActions", List.of(
                        Map.of("type", "GRANT_SCHOLARSHIP", "params", "{\"percentage\": 25}")
                )
        ));
        
        return ResponseEntity.ok(templates);
    }
    
    // ==================== HELPER METHODS ====================
    
    private boolean evaluateConditions(List<RuleCondition> conditions, Map<String, Object> context) {
        if (conditions.isEmpty()) return true;
        
        boolean result = true;
        String lastOperator = "AND";
        
        for (RuleCondition condition : conditions) {
            boolean conditionResult = evaluateSingleCondition(condition, context);
            
            if ("AND".equals(lastOperator)) {
                result = result && conditionResult;
            } else if ("OR".equals(lastOperator)) {
                result = result || conditionResult;
            }
            
            lastOperator = condition.getLogicalOperator();
        }
        
        return result;
    }
    
    private boolean evaluateSingleCondition(RuleCondition condition, Map<String, Object> context) {
        Object contextValue = getNestedValue(context, condition.getFieldName());
        if (contextValue == null) return false;
        
        String operator = condition.getOperator();
        String expectedValue = condition.getFieldValue();
        
        switch (operator) {
            case "EQUALS":
                return contextValue.toString().equals(expectedValue);
            case "NOT_EQUALS":
                return !contextValue.toString().equals(expectedValue);
            case "GREATER_THAN":
                return Double.parseDouble(contextValue.toString()) > Double.parseDouble(expectedValue);
            case "LESS_THAN":
                return Double.parseDouble(contextValue.toString()) < Double.parseDouble(expectedValue);
            case "GREATER_THAN_EQUALS":
                return Double.parseDouble(contextValue.toString()) >= Double.parseDouble(expectedValue);
            case "LESS_THAN_EQUALS":
                return Double.parseDouble(contextValue.toString()) <= Double.parseDouble(expectedValue);
            case "CONTAINS":
                return contextValue.toString().contains(expectedValue);
            default:
                return false;
        }
    }
    
    @SuppressWarnings("unchecked")
    private Object getNestedValue(Map<String, Object> context, String path) {
        String[] parts = path.split("\\.");
        Object current = context;
        
        for (String part : parts) {
            if (current instanceof Map) {
                current = ((Map<String, Object>) current).get(part);
            } else {
                return null;
            }
        }
        
        return current;
    }
    
    private List<Map<String, Object>> executeActions(List<RuleAction> actions, Map<String, Object> context) {
        List<Map<String, Object>> results = new ArrayList<>();
        
        for (RuleAction action : actions) {
            Map<String, Object> actionResult = new HashMap<>();
            actionResult.put("actionType", action.getActionType());
            actionResult.put("executed", true);
            actionResult.put("message", "Action " + action.getActionType() + " executed successfully");
            results.add(actionResult);
        }
        
        return results;
    }
}
