package com.lera.academy_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Real JDBC aggregates for centre ops (replaces sample-only numbers in {@code ReportsController} list UI).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CentreSummaryService {

    private final JdbcTemplate jdbcTemplate;

    public Map<String, Object> buildCentrePack(UUID centerId) {
        Map<String, Object> out = new HashMap<>();
        out.put("centerId", centerId.toString());
        out.put("generatedAt", LocalDateTime.now().toString());

        try {
            Long students = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM students WHERE center_id = ? "
                            + "AND COALESCE(UPPER(TRIM(status)), 'ACTIVE') = 'ACTIVE'",
                    Long.class,
                    centerId);
            out.put("activeStudents", students != null ? students : 0L);
        } catch (Exception e) {
            log.debug("activeStudents: {}", e.getMessage());
            out.put("activeStudents", null);
        }

        try {
            Long classes = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM classes WHERE center_id = ? "
                            + "AND COALESCE(UPPER(TRIM(status)), 'ONGOING') = 'ONGOING'",
                    Long.class,
                    centerId);
            out.put("ongoingClasses", classes != null ? classes : 0L);
        } catch (Exception e) {
            out.put("ongoingClasses", null);
        }

        try {
            Long teachers = jdbcTemplate.queryForObject(
                    "SELECT COUNT(DISTINCT teacher_id) FROM classes WHERE center_id = ? AND teacher_id IS NOT NULL",
                    Long.class,
                    centerId);
            out.put("teachersWithClasses", teachers != null ? teachers : 0L);
        } catch (Exception e) {
            out.put("teachersWithClasses", null);
        }

        try {
            BigDecimal revenue = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(i.total_amount), 0) FROM invoices i "
                            + "JOIN students s ON s.id = i.student_id "
                            + "WHERE s.center_id = ? "
                            + "AND UPPER(TRIM(COALESCE(i.status,''))) = 'PAID' "
                            + "AND i.paid_at >= NOW() - INTERVAL '30 days'",
                    BigDecimal.class,
                    centerId);
            out.put("paidRevenueLast30Days", revenue);
        } catch (Exception e) {
            log.debug("paidRevenueLast30Days: {}", e.getMessage());
            out.put("paidRevenueLast30Days", null);
        }

        try {
            Double attendanceRate = jdbcTemplate.queryForObject(
                    "SELECT CASE WHEN COUNT(*) = 0 THEN 0 ELSE "
                            + "100.0 * COUNT(*) FILTER (WHERE ca.status IN ('PRESENT','LATE')) / COUNT(*) END "
                            + "FROM class_attendance ca "
                            + "JOIN classes c ON c.id = ca.class_id "
                            + "WHERE c.center_id = ? "
                            + "AND ca.session_date >= CURRENT_DATE - INTERVAL '30 days'",
                    Double.class,
                    centerId);
            out.put("approxAttendancePresentRate30d", attendanceRate);
        } catch (Exception e) {
            log.debug("attendance rate: {}", e.getMessage());
            out.put("approxAttendancePresentRate30d", null);
        }

        return out;
    }
}
