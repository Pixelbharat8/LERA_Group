package com.lera.connect_service.repository;

import com.lera.connect_service.entity.Followup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface FollowupRepository extends JpaRepository<Followup, UUID> {

    /** Due, not-yet-actioned cadence steps — the auto-send scheduler picks these up. */
    List<Followup> findByStatusAndScheduledAtLessThanEqual(String status, LocalDateTime when);

    List<Followup> findByLeadId(UUID leadId);
    
    List<Followup> findByLeadIdOrderByCreatedAtDesc(UUID leadId);
    
    List<Followup> findByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT f FROM Followup f WHERE f.leadId IN "
            + "(SELECT l.id FROM Lead l WHERE l.centerId = :centerId) ORDER BY f.createdAt DESC")
    List<Followup> findByLeadCenterId(@Param("centerId") UUID centerId);
}
