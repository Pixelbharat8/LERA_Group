package com.lera.identity_service.repository;

import com.lera.identity_service.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {
    
    Page<ActivityLog> findByUserId(UUID userId, Pageable pageable);
    
    Page<ActivityLog> findByTenantId(UUID tenantId, Pageable pageable);
    
    List<ActivityLog> findByActivityType(String activityType);
    
    List<ActivityLog> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    Page<ActivityLog> findByTenantIdAndActivityType(UUID tenantId, String activityType, Pageable pageable);
}
