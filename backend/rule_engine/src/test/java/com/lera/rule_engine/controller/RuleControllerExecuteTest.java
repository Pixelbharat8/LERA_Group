package com.lera.rule_engine.controller;

import com.lera.rule_engine.entity.BusinessRule;
import com.lera.rule_engine.entity.RuleCondition;
import com.lera.rule_engine.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RuleControllerExecuteTest {

    @Mock private BusinessRuleRepository ruleRepository;
    @Mock private RuleConditionRepository conditionRepository;
    @Mock private RuleActionRepository actionRepository;
    @Mock private RuleExecutionRepository executionRepository;
    @InjectMocks private RuleController controller;

    private void ruleWithNumericCondition(UUID ruleId, String operator, String fieldValue) {
        when(ruleRepository.findById(ruleId)).thenReturn(Optional.of(
                BusinessRule.builder().id(ruleId).ruleName("Fee threshold").build()));
        when(conditionRepository.findByRuleIdOrderBySequenceOrder(ruleId)).thenReturn(List.of(
                RuleCondition.builder().fieldName("amount").operator(operator).fieldValue(fieldValue).build()));
    }

    @Test
    void execute_nonNumericContextValue_doesNotThrowAndConditionIsFalse() {
        UUID ruleId = UUID.randomUUID();
        ruleWithNumericCondition(ruleId, "GREATER_THAN", "100");

        // "not-a-number" > 100 used to throw NumberFormatException → 500.
        ResponseEntity<Map<String, Object>> resp =
                controller.executeRule(ruleId, Map.of("amount", "not-a-number"));

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(false, resp.getBody().get("conditionMet"));
    }

    @Test
    void execute_numericContextValue_greaterThanMatches() {
        UUID ruleId = UUID.randomUUID();
        ruleWithNumericCondition(ruleId, "GREATER_THAN", "100");
        when(actionRepository.findByRuleIdOrderBySequenceOrder(ruleId)).thenReturn(List.of());

        ResponseEntity<Map<String, Object>> resp =
                controller.executeRule(ruleId, Map.of("amount", "150"));

        assertEquals(true, resp.getBody().get("conditionMet"));
    }

    @Test
    void execute_numericContextValue_lessThanDoesNotMatch() {
        UUID ruleId = UUID.randomUUID();
        ruleWithNumericCondition(ruleId, "GREATER_THAN", "100");

        ResponseEntity<Map<String, Object>> resp =
                controller.executeRule(ruleId, Map.of("amount", "50"));

        assertEquals(false, resp.getBody().get("conditionMet"));
    }
}
