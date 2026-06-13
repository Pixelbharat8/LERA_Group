package com.lera.connect_service.repository;

import com.lera.connect_service.entity.CrmTrigger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CrmTriggerRepository extends JpaRepository<CrmTrigger, UUID> {
    List<CrmTrigger> findByLeadId(UUID leadId);
    List<CrmTrigger> findByAutomationId(UUID automationId);
    List<CrmTrigger> findByStatus(String status);
    List<CrmTrigger> findByLeadIdOrderByTriggeredAtDesc(UUID leadId);

    @Query("SELECT t FROM CrmTrigger t WHERE t.leadId IN "
            + "(SELECT l.id FROM Lead l WHERE l.centerId = :centerId) ORDER BY t.triggeredAt DESC")
    List<CrmTrigger> findByLeadCenterId(@Param("centerId") UUID centerId);
}
