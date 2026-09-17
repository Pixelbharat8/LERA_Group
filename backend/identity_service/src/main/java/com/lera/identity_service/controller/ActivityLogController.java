package com.lera.identity_service.controller;

import com.lera.identity_service.entity.ActivityLog;
import com.lera.identity_service.entity.User;
import com.lera.identity_service.model.ApiResponse;
import com.lera.identity_service.repository.UserRepository;
import com.lera.identity_service.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/activity-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF','STUDENT','PARENT')")
public class ActivityLogController {

    private final ActivityLogService activityLogService;
    private final UserRepository userRepository;

    /**
     * An activity_logs row identifies its actor only by user_id, so an audit trail rendered
     * straight from it names every actor with a raw UUID — and the screen's search box, which
     * filters on userEmail, could never match anything. Resolve the actors in one query.
     */
    private List<Map<String, Object>> withActors(List<ActivityLog> logs) {
        Set<UUID> userIds = logs.stream()
                .map(ActivityLog::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, User> byId = userIds.isEmpty()
                ? Map.of()
                : userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        List<Map<String, Object>> out = new ArrayList<>(logs.size());
        for (ActivityLog log : logs) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", log.getId());
            row.put("userId", log.getUserId());
            row.put("tenantId", log.getTenantId());
            row.put("activityType", log.getActivityType());
            row.put("description", log.getDescription());
            row.put("metadata", log.getMetadata());
            row.put("ipAddress", log.getIpAddress());
            row.put("userAgent", log.getUserAgent());
            row.put("createdAt", log.getCreatedAt());
            User actor = log.getUserId() != null ? byId.get(log.getUserId()) : null;
            row.put("userEmail", actor != null ? actor.getEmail() : null);
            row.put("userName", actor != null ? actor.getFullname() : null);
            out.add(row);
        }
        return out;
    }

    // Writing activity/audit records is staff-only — students/parents must not forge logs for other users.
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','TEACHER','STAFF')")
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

    // Whole-tenant / cross-user audit queries are admin-only (avoid activity-log disclosure).
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<ApiResponse<Page<Map<String, Object>>>> getTenantActivities(
            @PathVariable UUID tenantId,
            Pageable pageable) {
        Page<ActivityLog> activities = activityLogService.getTenantActivities(tenantId, pageable);
        // Enrich the whole page in one lookup — Page.map() would resolve actors row by row.
        Page<Map<String, Object>> enriched = new org.springframework.data.domain.PageImpl<>(
                withActors(activities.getContent()), pageable, activities.getTotalElements());
        return ResponseEntity.ok(ApiResponse.success(enriched));
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
    @GetMapping("/type/{activityType}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getActivitiesByType(
            @PathVariable String activityType) {
        List<ActivityLog> activities = activityLogService.getActivitiesByType(activityType);
        return ResponseEntity.ok(ApiResponse.success(withActors(activities)));
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getActivitiesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        List<ActivityLog> activities = activityLogService.getActivitiesByDateRange(start, end);
        return ResponseEntity.ok(ApiResponse.success(withActors(activities)));
    }
}
