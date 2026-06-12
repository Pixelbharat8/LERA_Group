package com.lera.rule_engine.service;

import com.lera.rule_engine.entity.BusinessRule;
import com.lera.rule_engine.repository.BusinessRuleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RuleServiceTest {

    @Mock
    private BusinessRuleRepository ruleRepository;

    @InjectMocks
    private RuleService ruleService;

    private BusinessRule testRule;
    private UUID ruleId;

    @BeforeEach
    void setUp() {
        ruleId = UUID.randomUUID();
        testRule = new BusinessRule();
        testRule.setId(ruleId);
        testRule.setRuleName("Late Fee Rule");
        testRule.setRuleType("FEE_DISCOUNT");
        testRule.setCategory("FINANCIAL");
        testRule.setIsActive(true);
        testRule.setPriority(10);
    }

    @Test
    void findAll_shouldReturnOrdered() {
        when(ruleRepository.findAllByOrderByPriorityDesc()).thenReturn(List.of(testRule));
        assertEquals(1, ruleService.findAll().size());
    }

    @Test
    void findAll_paginated() {
        Pageable pageable = PageRequest.of(0, 10);
        when(ruleRepository.findAll(pageable)).thenReturn(new PageImpl<>(List.of(testRule), pageable, 1));
        Page<BusinessRule> result = ruleService.findAll(pageable);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void findById_found() {
        when(ruleRepository.findById(ruleId)).thenReturn(Optional.of(testRule));
        assertTrue(ruleService.findById(ruleId).isPresent());
    }

    @Test
    void findActive() {
        when(ruleRepository.findByIsActiveTrueOrderByPriorityDesc()).thenReturn(List.of(testRule));
        assertEquals(1, ruleService.findActive().size());
    }

    @Test
    void findByType() {
        when(ruleRepository.findByRuleTypeAndIsActiveTrue("FEE_DISCOUNT")).thenReturn(List.of(testRule));
        assertEquals(1, ruleService.findByType("FEE_DISCOUNT").size());
    }

    @Test
    void create_shouldSetDefaults() {
        BusinessRule newRule = new BusinessRule();
        newRule.setRuleName("New Rule");
        when(ruleRepository.save(any())).thenAnswer(inv -> {
            BusinessRule r = inv.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        BusinessRule result = ruleService.create(newRule);
        assertTrue(result.getIsActive());
        assertEquals(0, result.getPriority());
        assertNotNull(result.getCreatedAt());
    }

    @Test
    void update_shouldUpdateFields() {
        BusinessRule details = new BusinessRule();
        details.setRuleName("Updated Rule");
        details.setPriority(20);

        when(ruleRepository.findById(ruleId)).thenReturn(Optional.of(testRule));
        when(ruleRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Optional<BusinessRule> result = ruleService.update(ruleId, details);
        assertTrue(result.isPresent());
        assertEquals("Updated Rule", result.get().getRuleName());
        assertEquals(20, result.get().getPriority());
    }

    @Test
    void toggleActive_shouldFlip() {
        when(ruleRepository.findById(ruleId)).thenReturn(Optional.of(testRule));
        when(ruleRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Optional<BusinessRule> result = ruleService.toggleActive(ruleId);
        assertTrue(result.isPresent());
        assertFalse(result.get().getIsActive()); // was true, now false
    }

    @Test
    void delete_exists() {
        when(ruleRepository.existsById(ruleId)).thenReturn(true);
        assertTrue(ruleService.delete(ruleId));
        verify(ruleRepository).deleteById(ruleId);
    }

    @Test
    void delete_notFound() {
        UUID id = UUID.randomUUID();
        when(ruleRepository.existsById(id)).thenReturn(false);
        assertFalse(ruleService.delete(id));
    }
}
