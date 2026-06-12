package com.lera.rule_engine.repository;

import com.lera.rule_engine.entity.BusinessRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BusinessRuleRepository extends JpaRepository<BusinessRule, UUID> {
    
    List<BusinessRule> findByIsActiveTrueOrderByPriorityDesc();
    
    List<BusinessRule> findByRuleTypeAndIsActiveTrue(String ruleType);
    
    List<BusinessRule> findByCategoryAndIsActiveTrue(String category);
    
    List<BusinessRule> findByAcademyIdAndIsActiveTrue(UUID academyId);
    
    List<BusinessRule> findByTenantIdAndIsActiveTrue(UUID tenantId);
    
    List<BusinessRule> findByRuleTypeAndAcademyIdAndIsActiveTrue(String ruleType, UUID academyId);
    
    List<BusinessRule> findAllByOrderByPriorityDesc();
}
