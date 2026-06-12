package com.lera.connect_service.repository;

import com.lera.connect_service.entity.LeadActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface LeadActivityRepository extends JpaRepository<LeadActivity, UUID> {
    List<LeadActivity> findByLeadId(UUID leadId);
    List<LeadActivity> findByActivityType(String activityType);
    List<LeadActivity> findByPerformedBy(UUID performedBy);
    List<LeadActivity> findByLeadIdOrderByActivityDateDesc(UUID leadId);
    List<LeadActivity> findByActivityDateBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT a FROM LeadActivity a WHERE a.leadId IN "
            + "(SELECT l.id FROM Lead l WHERE l.centerId = :centerId) ORDER BY a.activityDate DESC")
    List<LeadActivity> findByLeadCenterId(@Param("centerId") UUID centerId);
}
