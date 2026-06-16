package com.lera.academy.controller;

import com.lera.academy.entity.UserActivity;
import com.lera.academy.repository.UserActivityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@RestController
@RequestMapping("/api/user-activity")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF')")
public class UserActivityController {
    
    private final UserActivityRepository userActivityRepository;
    
    // Get all activities for a user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserActivity>> getUserActivities(@PathVariable UUID userId) {
        return ResponseEntity.ok(userActivityRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }
    
    // Get paginated activities for a user
    @GetMapping("/user/{userId}/paginated")
    public ResponseEntity<Page<UserActivity>> getUserActivitiesPaginated(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userActivityRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size)));
    }
    
    // Get activities by type for a user
    @GetMapping("/user/{userId}/type/{activityType}")
    public ResponseEntity<List<UserActivity>> getUserActivitiesByType(
            @PathVariable UUID userId, 
            @PathVariable String activityType) {
        return ResponseEntity.ok(userActivityRepository.findByUserIdAndActivityTypeOrderByCreatedAtDesc(userId, activityType));
    }
    
    // Get activities by entity type for a user
    @GetMapping("/user/{userId}/entity/{entityType}")
    public ResponseEntity<List<UserActivity>> getUserActivitiesByEntityType(
            @PathVariable UUID userId, 
            @PathVariable String entityType) {
        return ResponseEntity.ok(userActivityRepository.findByUserIdAndEntityTypeOrderByCreatedAtDesc(userId, entityType));
    }
    
    // Get activities by date range
    @GetMapping("/user/{userId}/range")
    public ResponseEntity<List<UserActivity>> getUserActivitiesByDateRange(
            @PathVariable UUID userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        return ResponseEntity.ok(userActivityRepository.findByUserIdAndDateRange(userId, start, end));
    }
    
    // Get activities by filter (daily, weekly, monthly, yearly)
    @GetMapping("/user/{userId}/filter/{filter}")
    public ResponseEntity<List<UserActivity>> getUserActivitiesByFilter(
            @PathVariable UUID userId, 
            @PathVariable String filter) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start;
        
        switch (filter.toLowerCase()) {
            case "daily":
                start = now.toLocalDate().atStartOfDay();
                break;
            case "weekly":
                start = now.minusWeeks(1);
                break;
            case "monthly":
                start = now.minusMonths(1);
                break;
            case "yearly":
                start = now.minusYears(1);
                break;
            default:
                start = now.minusMonths(1);
        }
        
        return ResponseEntity.ok(userActivityRepository.findByUserIdAndDateRange(userId, start, now));
    }
    
    // Log new activity — staff-only; students/parents must not forge activity for arbitrary users.
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','TEACHER','STAFF')")
    @PostMapping
    public ResponseEntity<UserActivity> logActivity(@Valid @RequestBody UserActivity activity) {
        UserActivity saved = userActivityRepository.save(activity);
        log.info("Logged activity for user {}: {}", activity.getUserId(), activity.getActivityType());
        return ResponseEntity.ok(saved);
    }
    
    // Log activity for a specific user — staff-only.
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','TEACHER','STAFF')")
    @PostMapping("/user/{userId}")
    public ResponseEntity<UserActivity> logUserActivity(
            @PathVariable UUID userId,
            @Valid @RequestBody UserActivity activity) {
        activity.setUserId(userId);
        UserActivity saved = userActivityRepository.save(activity);
        log.info("Logged activity for user {}: {}", userId, activity.getActivityType());
        return ResponseEntity.ok(saved);
    }
    
    // Get activity count for a user
    @GetMapping("/user/{userId}/count")
    public ResponseEntity<Map<String, Long>> getActivityCount(@PathVariable UUID userId) {
        long total = userActivityRepository.countByUserId(userId);
        return ResponseEntity.ok(Map.of("total", total));
    }
    
    // Get activity counts by type
    @GetMapping("/user/{userId}/counts")
    public ResponseEntity<Map<String, Long>> getActivityCountsByType(@PathVariable UUID userId) {
        Map<String, Long> counts = new HashMap<>();
        counts.put("total", userActivityRepository.countByUserId(userId));
        counts.put("enrollment", userActivityRepository.countByUserIdAndActivityType(userId, "ENROLLMENT"));
        counts.put("payment", userActivityRepository.countByUserIdAndActivityType(userId, "PAYMENT"));
        counts.put("attendance", userActivityRepository.countByUserIdAndActivityType(userId, "ATTENDANCE"));
        counts.put("class_switch", userActivityRepository.countByUserIdAndActivityType(userId, "CLASS_SWITCH"));
        counts.put("document", userActivityRepository.countByUserIdAndActivityType(userId, "DOCUMENT"));
        return ResponseEntity.ok(counts);
    }
    
    // Get activity timeline (grouped by date)
    @GetMapping("/user/{userId}/timeline")
    public ResponseEntity<Map<String, List<UserActivity>>> getActivityTimeline(@PathVariable UUID userId) {
        List<UserActivity> activities = userActivityRepository.findByUserIdOrderByCreatedAtDesc(userId);
        Map<String, List<UserActivity>> timeline = new LinkedHashMap<>();
        
        for (UserActivity activity : activities) {
            String date = activity.getCreatedAt().toLocalDate().toString();
            timeline.computeIfAbsent(date, k -> new ArrayList<>()).add(activity);
        }
        
        return ResponseEntity.ok(timeline);
    }
}
