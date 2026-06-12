package com.lera.connect_service.repository;

import com.lera.connect_service.entity.CrmAutomation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmAutomationRepository extends JpaRepository<CrmAutomation, UUID> {
    Optional<CrmAutomation> findByAutomationName(String automationName);
    List<CrmAutomation> findByIsActive(Boolean isActive);
    List<CrmAutomation> findByTriggerType(String triggerType);
    List<CrmAutomation> findByIsActiveTrue();
}
