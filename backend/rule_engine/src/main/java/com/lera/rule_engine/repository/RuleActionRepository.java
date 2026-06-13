package com.lera.rule_engine.repository;

import com.lera.rule_engine.entity.RuleAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RuleActionRepository extends JpaRepository<RuleAction, UUID> {
    
    List<RuleAction> findByRuleIdOrderBySequenceOrder(UUID ruleId);
    
    void deleteByRuleId(UUID ruleId);
}
