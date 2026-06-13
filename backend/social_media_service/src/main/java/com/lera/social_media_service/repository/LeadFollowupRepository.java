package com.lera.social_media_service.repository;

import com.lera.social_media_service.entity.LeadFollowup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface LeadFollowupRepository extends JpaRepository<LeadFollowup, UUID> {
    
    List<LeadFollowup> findByLeadIdOrderByScheduledAtDesc(UUID leadId);
    
    List<LeadFollowup> findByAssignedToOrderByScheduledAtAsc(UUID assignedTo);
    
    List<LeadFollowup> findByStatusOrderByScheduledAtAsc(String status);
    
    List<LeadFollowup> findByScheduledAtBetweenAndStatus(LocalDateTime start, LocalDateTime end, String status);
    
    List<LeadFollowup> findByAssignedToAndStatusOrderByScheduledAtAsc(UUID assignedTo, String status);
    
    long countByLeadIdAndStatus(UUID leadId, String status);
}
