package com.lera.connect_service.repository;

import com.lera.connect_service.entity.CampaignLead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CampaignLeadRepository extends JpaRepository<CampaignLead, UUID> {
    List<CampaignLead> findByCampaignId(UUID campaignId);
    List<CampaignLead> findByLeadId(UUID leadId);
    Optional<CampaignLead> findByCampaignIdAndLeadId(UUID campaignId, UUID leadId);
    List<CampaignLead> findByStatus(String status);
    long countByCampaignId(UUID campaignId);

    @Query("SELECT cl FROM CampaignLead cl WHERE cl.leadId IN "
            + "(SELECT l.id FROM Lead l WHERE l.centerId = :centerId)")
    List<CampaignLead> findByLeadCenterId(@Param("centerId") UUID centerId);
}
