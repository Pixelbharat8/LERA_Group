package com.lera.identity_service.controller;

import com.lera.identity_service.entity.ActivityLog;
import com.lera.identity_service.model.ApiResponse;
import com.lera.identity_service.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/activity-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF','STUDENT','PARENT')")
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    @PostMapping
    public ResponseEntity<ApiResponse<ActivityLog>> logActivity(
            @RequestParam UUID userId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam String activityType,
            @RequestParam String description,
            @RequestParam(required = false) String metadata,
            @RequestParam(required = false) String ipAddress,
            @RequestParam(required = false) String userAgent) {
        
        ActivityLog log = activityLogService.logActivity(
                userId, tenantId, activityType, description, metadata, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success(log, "Activity logged"));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Page<ActivityLog>>> getUserActivities(
            @PathVariable UUID userId,
            Pageable pageable) {
        Page<ActivityLog> activities = activityLogService.getUserActivities(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<ApiResponse<Page<ActivityLog>>> getTenantActivities(
            @PathVariable UUID tenantId,
            Pageable pageable) {
        Page<ActivityLog> activities = activityLogService.getTenantActivities(tenantId, pageable);
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @GetMapping("/type/{activityType}")
    public ResponseEntity<ApiResponse<List<ActivityLog>>> getActivitiesByType(
            @PathVariable String activityType) {
        List<ActivityLog> activities = activityLogService.getActivitiesByType(activityType);
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<ActivityLog>>> getActivitiesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        List<ActivityLog> activities = activityLogService.getActivitiesByDateRange(start, end);
        return ResponseEntity.ok(ApiResponse.success(activities));
    }
}
