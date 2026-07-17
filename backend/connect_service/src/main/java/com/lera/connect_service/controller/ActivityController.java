package com.lera.connect_service.controller;

import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.*;

/**
 * Activity feed backed by the REAL {@code audit_logs} table (written by every service via
 * JdbcAuditWriter). Previously this controller fabricated activities and hardcoded stats
 * (totalActivities=1250, Math.random trend) — all removed. Read-only over the audit trail;
 * activities are recorded automatically, so there is no manual "log activity" write.
 */
@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ActivityController {

    private final JdbcTemplate jdbc;

    private Map<String, Object> toActivity(Map<String, Object> row) {
        Map<String, Object> a = new HashMap<>();
        a.put("id", str(row.get("id")));
        a.put("type", row.get("action"));
        a.put("title", row.get("action"));
        a.put("entityType", row.get("entity_type"));
        a.put("entityId", str(row.get("entity_id")));
        a.put("userId", str(row.get("user_id")));
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("ip", row.get("ip_address"));
        metadata.put("userAgent", row.get("user_agent"));
        a.put("metadata", metadata);
        a.put("createdAt", row.get("created_at"));
        return a;
    }

    private static String str(Object o) { return o == null ? null : o.toString(); }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getActivities(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Integer limit,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertStaffOrSelfUserQuery(authUser, userId);

        StringBuilder sql = new StringBuilder(
                "SELECT id, action, entity_type, entity_id, user_id, ip_address, user_agent, created_at "
                + "FROM audit_logs WHERE 1=1");
        List<Object> args = new ArrayList<>();
        if (type != null && !type.isBlank() && !"all".equalsIgnoreCase(type)) {
            sql.append(" AND action = ?"); args.add(type);
        }
        if (userId != null && !userId.isBlank()) {
            sql.append(" AND user_id = ?::uuid"); args.add(userId);
        }
        if (entityType != null && !entityType.isBlank()) {
            sql.append(" AND entity_type = ?"); args.add(entityType);
        }
        int cap = limit != null ? Math.min(Math.max(limit, 1), 200) : 50;
        sql.append(" ORDER BY created_at DESC LIMIT ").append(cap);

        List<Map<String, Object>> rows = jdbc.queryForList(sql.toString(), args.toArray());
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> r : rows) out.add(toActivity(r));
        return ResponseEntity.ok(out);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getActivityById(
            @PathVariable String id,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertStaffOrSelfUserQuery(authUser, null);
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id, action, entity_type, entity_id, user_id, ip_address, user_agent, created_at "
                + "FROM audit_logs WHERE id = ?::uuid LIMIT 1", id);
        if (rows.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(toActivity(rows.get(0)));
    }

    // Activities are recorded automatically in the audit trail — there is no manual logging path.
    @PostMapping
    public ResponseEntity<Map<String, Object>> logActivity(
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertOrgWideMutation(authUser);
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(Map.of(
                "error", "Activities are captured automatically in the audit trail; manual logging is not supported."));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getActivitiesByUser(
            @PathVariable String userId,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertStaffOrSelfUserQuery(authUser, userId);
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id, action, entity_type, entity_id, user_id, ip_address, user_agent, created_at "
                + "FROM audit_logs WHERE user_id = ?::uuid ORDER BY created_at DESC LIMIT 50", userId);
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> r : rows) out.add(toActivity(r));
        return ResponseEntity.ok(out);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getActivityStats(
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertStaffOrSelfUserQuery(authUser, null);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalActivities", jdbc.queryForObject("SELECT count(*) FROM audit_logs", Long.class));
        stats.put("todayActivities", jdbc.queryForObject(
                "SELECT count(*) FROM audit_logs WHERE created_at >= current_date", Long.class));
        stats.put("activeUsers", jdbc.queryForObject(
                "SELECT count(DISTINCT user_id) FROM audit_logs WHERE created_at >= current_date", Long.class));

        Map<String, Object> byType = new LinkedHashMap<>();
        for (Map<String, Object> r : jdbc.queryForList(
                "SELECT action, count(*) AS c FROM audit_logs GROUP BY action ORDER BY c DESC LIMIT 10")) {
            byType.put(String.valueOf(r.get("action")), r.get("c"));
        }
        stats.put("byType", byType);

        List<Map<String, Object>> hourlyTrend = new ArrayList<>();
        Map<Integer, Long> byHour = new HashMap<>();
        for (Map<String, Object> r : jdbc.queryForList(
                "SELECT EXTRACT(HOUR FROM created_at)::int AS hour, count(*) AS c "
                + "FROM audit_logs WHERE created_at >= current_date GROUP BY hour")) {
            byHour.put(((Number) r.get("hour")).intValue(), ((Number) r.get("c")).longValue());
        }
        for (int i = 0; i < 24; i++) {
            Map<String, Object> hour = new HashMap<>();
            hour.put("hour", i);
            hour.put("count", byHour.getOrDefault(i, 0L));
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
        int cap = Math.min(Math.max(limit, 1), 50);
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id, action, entity_type, entity_id, user_id, ip_address, user_agent, created_at "
                + "FROM audit_logs ORDER BY created_at DESC LIMIT " + cap);
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> r : rows) out.add(toActivity(r));
        return ResponseEntity.ok(out);
    }
}
