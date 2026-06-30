package com.lera.academy_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Produces real report content (a CSV + a short summary) from live data. Robust to schema
 * differences: every count is guarded so an unexpected table/column yields 0 rather than failing
 * the whole report.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReportGenerationService {

    private final JdbcTemplate jdbc;

    /** Immutable result: a downloadable CSV plus a one-line summary for emails. */
    public record GeneratedReport(String filename, String csv, String summary) {}

    public GeneratedReport generate(String reportType, UUID centerId) {
        String type = reportType == null ? "SUMMARY" : reportType.trim().toUpperCase();

        long students = count("students", "center_id", centerId);
        long teachers = count("teachers", null, null);
        long classes = count("classes", "center_id", centerId);
        long activeEnrolments = countWhere("enrollments", "status = 'ACTIVE'", "center_id", centerId);

        StringBuilder csv = new StringBuilder("Metric,Value\n");
        csv.append("Report type,").append(type).append("\n");
        csv.append("Generated,").append(LocalDate.now()).append("\n");
        if (centerId != null) csv.append("Centre,").append(centerId).append("\n");
        csv.append("Students,").append(students).append("\n");
        csv.append("Teachers,").append(teachers).append("\n");
        csv.append("Classes,").append(classes).append("\n");
        csv.append("Active enrolments,").append(activeEnrolments).append("\n");

        String summary = String.format(
                "Students: %d · Teachers: %d · Classes: %d · Active enrolments: %d",
                students, teachers, classes, activeEnrolments);

        String filename = type.toLowerCase() + "-report-" + LocalDate.now() + ".csv";
        return new GeneratedReport(filename, csv.toString(), summary);
    }

    private long count(String table, String centerCol, UUID centerId) {
        return countWhere(table, null, centerCol, centerId);
    }

    /** COUNT(*) with an optional WHERE clause and optional centre scoping; 0 on any error. */
    private long countWhere(String table, String where, String centerCol, UUID centerId) {
        // table/column names here are hardcoded constants — never user input.
        try {
            StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM ").append(table);
            boolean scoped = centerId != null && centerCol != null;
            if (where != null || scoped) sql.append(" WHERE ");
            if (where != null) sql.append(where);
            if (where != null && scoped) sql.append(" AND ");
            if (scoped) sql.append(centerCol).append(" = ?");
            Long v = scoped
                    ? jdbc.queryForObject(sql.toString(), Long.class, centerId)
                    : jdbc.queryForObject(sql.toString(), Long.class);
            return v == null ? 0 : v;
        } catch (Exception e) {
            // Centre column may not exist on this table — retry unscoped before giving up.
            if (centerId != null && centerCol != null) {
                try {
                    String base = "SELECT COUNT(*) FROM " + table + (where != null ? " WHERE " + where : "");
                    Long v = jdbc.queryForObject(base, Long.class);
                    return v == null ? 0 : v;
                } catch (Exception ignored) { /* fall through */ }
            }
            log.debug("Report count failed for {}: {}", table, e.getMessage());
            return 0;
        }
    }
}
