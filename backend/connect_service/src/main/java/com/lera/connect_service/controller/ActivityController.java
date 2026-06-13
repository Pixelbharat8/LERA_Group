package com.lera.connect_service.controller;

import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ActivityController {

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getActivities(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Integer limit,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertStaffOrSelfUserQuery(authUser, userId);

        List<Map<String, Object>> activities = new ArrayList<>();

        String[] types = {
            "USER_LOGIN", "USER_LOGOUT", "LEAD_CREATED", "LEAD_UPDATED",
            "STUDENT_ENROLLED", "PAYMENT_RECEIVED", "ASSIGNMENT_SUBMITTED",
            "EXAM_COMPLETED", "MESSAGE_SENT", "NOTIFICATION_SENT"
        };

        String[] titles = {
            "User Login", "User Logout", "New Lead Created", "Lead Updated",
            "Student Enrolled", "Payment Received", "Assignment Submitted",
            "Exam Completed", "Message Sent", "Notification Sent"
        };

        String[] descriptions = {
            "User logged in successfully",
            "User logged out",
            "New lead added to CRM",
            "Lead information updated",
            "New student enrolled in course",
            "Payment processed successfully",
            "Student submitted assignment",
            "Student completed exam",
            "New message sent",
            "System notification sent"
        };

        String[] userNames = {"Admin User", "Teacher John", "Student Jane", "Staff Mike", "Manager Sarah"};

        int count = limit != null ? Math.min(limit, 30) : 20;

        for (int i = 0; i < count; i++) {
            Map<String, Object> activity = new HashMap<>();
            int typeIndex = i % types.length;

            if (type != null && !type.equals("all") && !types[typeIndex].equals(type)) {
                continue;
            }

            activity.put("id", UUID.randomUUID().toString());
            activity.put("type", types[typeIndex]);
            activity.put("title", titles[typeIndex]);
            activity.put("description", descriptions[typeIndex]);
            activity.put("userId", userId != null ? userId : "user-" + (i % 10 + 1));
            activity.put("userName", userNames[i % userNames.length]);
            activity.put("entityType", i % 2 == 0 ? "USER" : "LEAD");
            activity.put("entityId", "entity-" + (i + 1));

            Map<String, String> metadata = new HashMap<>();
            metadata.put("ip", "192.168.1." + (i % 256));
            metadata.put("browser", i % 2 == 0 ? "Chrome" : "Firefox");
            activity.put("metadata", metadata);

            activity.put("createdAt", LocalDateTime.now().minusMinutes(i * 15));
            activities.add(activity);
        }

        return ResponseEntity.ok(activities);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getActivityById(
            @PathVariable String id,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertStaffOrSelfUserQuery(authUser, null);

        Map<String, Object> activity = new HashMap<>();
        activity.put("id", id);
        activity.put("type", "USER_LOGIN");
        activity.put("title", "User Login");
        activity.put("description", "User logged in successfully from Chrome browser");
        activity.put("userId", "user-1");
        activity.put("userName", "Admin User");
        activity.put("entityType", "USER");
        activity.put("entityId", "user-1");

        Map<String, String> metadata = new HashMap<>();
        metadata.put("ip", "192.168.1.100");
        metadata.put("browser", "Chrome");
        metadata.put("device", "Desktop");
        metadata.put("location", "Ho Chi Minh City");
        activity.put("metadata", metadata);

        activity.put("createdAt", LocalDateTime.now().minusHours(1));

        return ResponseEntity.ok(activity);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> logActivity(
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertOrgWideMutation(authUser);

        Map<String, Object> activity = new HashMap<>(request);
        activity.put("id", UUID.randomUUID().toString());
        activity.put("createdAt", LocalDateTime.now());

        return ResponseEntity.ok(activity);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getActivitiesByUser(
            @PathVariable String userId,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertStaffOrSelfUserQuery(authUser, userId);

        List<Map<String, Object>> activities = new ArrayList<>();

        String[] types = {"USER_LOGIN", "MESSAGE_SENT", "NOTIFICATION_SENT"};
        String[] titles = {"User Login", "Message Sent", "Notification Sent"};

        for (int i = 0; i < 10; i++) {
            Map<String, Object> activity = new HashMap<>();
            int typeIndex = i % types.length;

            activity.put("id", UUID.randomUUID().toString());
            activity.put("type", types[typeIndex]);
            activity.put("title", titles[typeIndex]);
            activity.put("description", "Activity description " + (i + 1));
            activity.put("userId", userId);
            activity.put("userName", "User Name");
            activity.put("createdAt", LocalDateTime.now().minusMinutes(i * 30));
            activities.add(activity);
        }

        return ResponseEntity.ok(activities);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getActivityStats(
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertStaffOrSelfUserQuery(authUser, null);

        Map<String, Object> stats = new HashMap<>();

        stats.put("totalActivities", 1250);
        stats.put("todayActivities", 85);
        stats.put("activeUsers", 42);

        Map<String, Integer> byType = new HashMap<>();
        byType.put("USER_LOGIN", 450);
        byType.put("LEAD_CREATED", 120);
        byType.put("STUDENT_ENROLLED", 85);
        byType.put("PAYMENT_RECEIVED", 230);
        byType.put("MESSAGE_SENT", 365);
        stats.put("byType", byType);

        List<Map<String, Object>> hourlyTrend = new ArrayList<>();
        for (int i = 0; i < 24; i++) {
            Map<String, Object> hour = new HashMap<>();
            hour.put("hour", i);
            hour.put("count", 10 + (int) (Math.random() * 40));
            hourlyTrend.add(hour);
        }
        stats.put("hourlyTrend", hourlyTrend);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<Map<String, Object>>> getRecentActivities(
            @RequestParam(defaultValue = "10") int limit,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertStaffOrSelfUserQuery(authUser, null);

        List<Map<String, Object>> activities = new ArrayList<>();

        String[] types = {"USER_LOGIN", "LEAD_CREATED", "PAYMENT_RECEIVED", "STUDENT_ENROLLED", "MESSAGE_SENT"};
        String[] titles = {"User Login", "New Lead", "Payment", "Enrollment", "Message"};
        String[] userNames = {"Admin", "Teacher", "Staff", "Manager"};

        for (int i = 0; i < Math.min(limit, 20); i++) {
            Map<String, Object> activity = new HashMap<>();
            int typeIndex = i % types.length;

            activity.put("id", UUID.randomUUID().toString());
            activity.put("type", types[typeIndex]);
            activity.put("title", titles[typeIndex]);
            activity.put("userName", userNames[i % userNames.length]);
            activity.put("createdAt", LocalDateTime.now().minusMinutes(i * 5));
            activities.add(activity);
        }

        return ResponseEntity.ok(activities);
    }
}
