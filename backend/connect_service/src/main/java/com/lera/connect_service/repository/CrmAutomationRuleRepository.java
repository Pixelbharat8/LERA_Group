package com.lera.connect_service.repository;

import com.lera.connect_service.entity.CrmAutomationRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CrmAutomationRuleRepository extends JpaRepository<CrmAutomationRule, UUID> {
    List<CrmAutomationRule> findByAutomationId(UUID automationId);
    List<CrmAutomationRule> findByAutomationIdOrderByRuleOrderAsc(UUID automationId);
}
