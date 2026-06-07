package com.lera.connect_service.repository;

import com.lera.connect_service.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface LeadRepository extends JpaRepository<Lead, UUID> {
    
    List<Lead> findByStatusOrderByCreatedAtDesc(String status);
    
    List<Lead> findByCenterIdOrderByCreatedAtDesc(UUID centerId);
    
    List<Lead> findByCenterIdAndStatusOrderByCreatedAtDesc(UUID centerId, String status);
    
    List<Lead> findByAssignedToOrderByCreatedAtDesc(UUID assignedTo);
    
    List<Lead> findBySourceIdOrderByCreatedAtDesc(UUID sourceId);
    
    @Query("SELECT COUNT(l) FROM Lead l WHERE l.status = :status")
    long countByStatus(String status);
    
    @Query("SELECT COUNT(l) FROM Lead l WHERE l.centerId = :centerId AND l.status = :status")
    long countByCenterIdAndStatus(UUID centerId, String status);
    
    List<Lead> findAllByOrderByCreatedAtDesc();
    
    List<Lead> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT l FROM Lead l WHERE LOWER(l.parentName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(l.studentName) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Lead> searchLeads(String search);

    // --- Marketing ROI: lead funnel grouped by channel ---
    // Row: [bucket, totalLeads, trialStage, converted]
    @Query("SELECT COALESCE(l.utmSource, 'Direct / Unknown'), COUNT(l), "
         + "SUM(CASE WHEN l.status IN ('TRIAL_BOOKED','TRIAL_ATTENDED') THEN 1 ELSE 0 END), "
         + "SUM(CASE WHEN l.status = 'CONVERTED' THEN 1 ELSE 0 END) "
         + "FROM Lead l WHERE (:centerId IS NULL OR l.centerId = :centerId) "
         + "GROUP BY l.utmSource ORDER BY COUNT(l) DESC")
    List<Object[]> conversionBySource(UUID centerId);

    @Query("SELECT COALESCE(l.utmCampaign, '(none)'), COUNT(l), "
         + "SUM(CASE WHEN l.status IN ('TRIAL_BOOKED','TRIAL_ATTENDED') THEN 1 ELSE 0 END), "
         + "SUM(CASE WHEN l.status = 'CONVERTED' THEN 1 ELSE 0 END) "
         + "FROM Lead l WHERE (:centerId IS NULL OR l.centerId = :centerId) "
         + "GROUP BY l.utmCampaign ORDER BY COUNT(l) DESC")
    List<Object[]> conversionByCampaign(UUID centerId);
}
