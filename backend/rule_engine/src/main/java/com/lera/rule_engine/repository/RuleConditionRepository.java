package com.lera.rule_engine.repository;

import com.lera.rule_engine.entity.RuleCondition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RuleConditionRepository extends JpaRepository<RuleCondition, UUID> {
    
    List<RuleCondition> findByRuleIdOrderBySequenceOrder(UUID ruleId);
    
    void deleteByRuleId(UUID ruleId);
}
