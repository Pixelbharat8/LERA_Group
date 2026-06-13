package com.lera.rule_engine.repository;

import com.lera.rule_engine.entity.RuleExecution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface RuleExecutionRepository extends JpaRepository<RuleExecution, UUID> {
    
    List<RuleExecution> findByRuleIdOrderByExecutedAtDesc(UUID ruleId);
    
    List<RuleExecution> findByExecutedAtBetween(LocalDateTime start, LocalDateTime end);
    
    List<RuleExecution> findByConditionResultTrueOrderByExecutedAtDesc();
    
    long countByRuleIdAndConditionResultTrue(UUID ruleId);
    
    long countByRuleIdAndConditionResultFalse(UUID ruleId);
}
