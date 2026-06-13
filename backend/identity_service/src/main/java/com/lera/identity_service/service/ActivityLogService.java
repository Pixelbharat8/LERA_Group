package com.lera.identity_service.service;

import com.lera.identity_service.entity.ActivityLog;
import com.lera.identity_service.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    @Transactional
    public ActivityLog log(UUID userId, UUID tenantId, String activityType, String description) {
        return log(userId, tenantId, activityType, description, null, null, null);
    }

    @Transactional
    public ActivityLog log(UUID userId, UUID tenantId, String activityType, String description,
                           String metadata, String ipAddress, String userAgent) {
        ActivityLog activityLog = ActivityLog.builder()
                .userId(userId)
                .tenantId(tenantId)
                .activityType(activityType)
                .description(description)
                .metadata(metadata)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .createdAt(LocalDateTime.now())
                .build();

        return activityLogRepository.save(activityLog);
    }

    // --- Controller-facing aliases ---

    @Transactional
    public ActivityLog logActivity(UUID userId, UUID tenantId, String activityType, String description,
                                   String metadata, String ipAddress, String userAgent) {
        return log(userId, tenantId, activityType, description, metadata, ipAddress, userAgent);
    }

    @Transactional(readOnly = true)
    public Page<ActivityLog> getUserActivities(UUID userId, Pageable pageable) {
        return activityLogRepository.findByUserId(userId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<ActivityLog> getTenantActivities(UUID tenantId, Pageable pageable) {
        return activityLogRepository.findByTenantId(tenantId, pageable);
    }

    @Transactional(readOnly = true)
    public List<ActivityLog> getActivitiesByType(String activityType) {
        return activityLogRepository.findByActivityType(activityType);
    }

    @Transactional(readOnly = true)
    public List<ActivityLog> getActivitiesByDateRange(LocalDateTime start, LocalDateTime end) {
        return activityLogRepository.findByCreatedAtBetween(start, end);
    }

    // --- Existing methods kept for compatibility ---

    @Transactional(readOnly = true)
    public Page<ActivityLog> getActivityLogsByUser(UUID userId, Pageable pageable) {
        return activityLogRepository.findByUserId(userId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<ActivityLog> getActivityLogsByTenant(UUID tenantId, Pageable pageable) {
        return activityLogRepository.findByTenantId(tenantId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<ActivityLog> getActivityLogsByTenantAndType(UUID tenantId, String activityType, Pageable pageable) {
        return activityLogRepository.findByTenantIdAndActivityType(tenantId, activityType, pageable);
    }
}
