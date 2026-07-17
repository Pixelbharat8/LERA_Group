package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.service.CentreSummaryService;
import com.lera.academy_service.service.ReportGenerationService;
import com.lera.academy_service.service.ReportSchedulerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize(AcademyRoles.STAFF)
@RequiredArgsConstructor
public class ReportsController {

    private final CentreSummaryService centreSummaryService;
    private final com.lera.academy_service.security.AcademyAuthorizationService authz;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final com.lera.academy_service.repository.ScheduledReportRepository scheduledReportRepository;
    private final ReportGenerationService reportGenerationService;
    private final ReportSchedulerService reportSchedulerService;

    /**
     * Enrolment cohort retention: groups enrolments by start month and reports how many are still
     * active vs completed vs churned, with a retention rate. Centre-scoped.
     */
    @GetMapping("/cohorts")
    public ResponseEntity<List<Map<String, Object>>> cohortRetention(@RequestParam(required = false) UUID centerId) {
        UUID eff = (authz.isOrgWide() && centerId == null) ? null : authz.effectiveListCenterId(centerId);
        StringBuilder sql = new StringBuilder(
                "SELECT to_char(date_trunc('month', e.start_date), 'YYYY-MM') AS cohort, "
              + "count(*) AS total, "
              + "count(*) FILTER (WHERE e.status = 'ACTIVE') AS active, "
              + "count(*) FILTER (WHERE e.status IN ('COMPLETED','GRADUATED')) AS completed, "
              + "count(*) FILTER (WHERE e.status IN ('WITHDRAWN','DROPPED','CANCELLED')) AS churned "
              + "FROM enrollments e ");
        List<Object> args = new java.util.ArrayList<>();
        if (eff != null) {
            sql.append("JOIN classes c ON c.id = e.class_id WHERE e.start_date IS NOT NULL AND c.center_id = ? ");
            args.add(eff);
        } else {
            sql.append("WHERE e.start_date IS NOT NULL ");
        }
        sql.append("GROUP BY date_trunc('month', e.start_date) ORDER BY date_trunc('month', e.start_date)");
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql.toString(), args.toArray());
        for (Map<String, Object> r : rows) {
            long total = ((Number) r.get("total")).longValue();
            long active = ((Number) r.get("active")).longValue();
            r.put("retentionRate", total > 0 ? Math.round(active * 1000.0 / total) / 10.0 : 0);
        }
        return ResponseEntity.ok(rows);
    }

    /**
     * Live aggregates for a centre (students, classes, revenue, attendance) — JSON pack for dashboards / exports.
     */
    @GetMapping("/centre-summary")
    public ResponseEntity<Map<String, Object>> getCentreSummary(@RequestParam UUID centerId) {
        UUID eff = authz.effectiveListCenterId(centerId);   // 403 if a centre-bound caller requests another centre
        return ResponseEntity.ok(centreSummaryService.buildCentrePack(eff));
    }

    // Get all available reports
    // The persisted "reports" are the scheduled-report definitions; on-demand reports are produced
    // by POST /generate. Previously this returned fabricated sample rows — now returns real data.
    @GetMapping
    public ResponseEntity<?> getAllReports(
            @RequestParam(required = false) UUID centerId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(scheduledReportRepository.findAllByOrderByCreatedAtDesc());
    }

    // Get a specific scheduled report (real), or 404. Previously returned a fabricated report.
    @GetMapping("/{reportId}")
    public ResponseEntity<?> getReportById(@PathVariable UUID reportId) {
        return scheduledReportRepository.findById(reportId)
                .map(r -> ResponseEntity.ok((Object) r))
                .orElse(ResponseEntity.notFound().build());
    }

    // Generate a report now from live data — returns a downloadable CSV + summary.
    @PostMapping("/generate")
    public ResponseEntity<?> generateReport(@RequestBody(required = false) Map<String, Object> request) {
        Map<String, Object> req = request != null ? request : new HashMap<>();
        Object typeRaw = req.getOrDefault("type", req.getOrDefault("reportType", "SUMMARY"));
        String reportType = typeRaw != null ? String.valueOf(typeRaw) : "SUMMARY";
        UUID centerId = null;
        Object cid = req.get("centerId");
        if (cid != null && !String.valueOf(cid).isBlank()) {
            try { centerId = UUID.fromString(String.valueOf(cid)); } catch (Exception ignored) { }
        }
        ReportGenerationService.GeneratedReport report = reportGenerationService.generate(reportType, centerId);
        Map<String, Object> response = new HashMap<>();
        response.put("filename", report.filename());
        response.put("csv", report.csv());
        response.put("summary", report.summary());
        response.put("type", reportType);
        response.put("status", "ready");
        response.put("generatedAt", LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }

    // ---- Scheduled reports (email on a schedule) ----

    @GetMapping("/scheduled")
    public ResponseEntity<List<com.lera.academy_service.entity.ScheduledReport>> listScheduled() {
        return ResponseEntity.ok(scheduledReportRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping("/scheduled")
    public ResponseEntity<com.lera.academy_service.entity.ScheduledReport> createScheduled(
            @RequestBody com.lera.academy_service.entity.ScheduledReport body) {
        body.setId(null);
        if (body.getEnabled() == null) body.setEnabled(true);
        if (body.getReportType() == null) body.setReportType("SUMMARY");
        if (body.getFrequency() == null) body.setFrequency("WEEKLY");
        if (body.getNextRun() == null) {
            body.setNextRun(ReportSchedulerService.nextRun(body.getFrequency(), LocalDateTime.now()));
        }
        body.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.ok(scheduledReportRepository.save(body));
    }

    @PutMapping("/scheduled/{id}")
    public ResponseEntity<com.lera.academy_service.entity.ScheduledReport> updateScheduled(
            @PathVariable UUID id, @RequestBody com.lera.academy_service.entity.ScheduledReport body) {
        return scheduledReportRepository.findById(id).map(r -> {
            if (body.getName() != null) r.setName(body.getName());
            if (body.getReportType() != null) r.setReportType(body.getReportType());
            if (body.getFrequency() != null) { r.setFrequency(body.getFrequency()); r.setNextRun(ReportSchedulerService.nextRun(body.getFrequency(), LocalDateTime.now())); }
            if (body.getRecipients() != null) r.setRecipients(body.getRecipients());
            if (body.getCenterId() != null) r.setCenterId(body.getCenterId());
            if (body.getEnabled() != null) r.setEnabled(body.getEnabled());
            return ResponseEntity.ok(scheduledReportRepository.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/scheduled/{id}")
    public ResponseEntity<Void> deleteScheduled(@PathVariable UUID id) {
        scheduledReportRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Run a scheduled report immediately (generate + email now).
    @PostMapping("/scheduled/{id}/run-now")
    public ResponseEntity<?> runScheduledNow(@PathVariable UUID id) {
        return scheduledReportRepository.findById(id).map(r -> {
            reportSchedulerService.runOne(r);
            return ResponseEntity.ok(Map.of("status", "ran", "lastRun", r.getLastRun().toString()));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Download report
    @GetMapping("/{reportId}/download")
    public ResponseEntity<?> downloadReport(@PathVariable UUID reportId) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", reportId.toString());
        response.put("downloadUrl", "/api/reports/" + reportId + "/file");
        response.put("filename", "report_" + reportId.toString().substring(0, 8) + ".pdf");
        response.put("expiresAt", LocalDateTime.now().plusHours(24).toString());
        return ResponseEntity.ok(response);
    }

    // Get report types
    @GetMapping("/types")
    public ResponseEntity<?> getReportTypes() {
        List<Map<String, Object>> types = new ArrayList<>();
        
        String[][] reportTypes = {
            {"attendance", "Attendance Report", "Track student and staff attendance"},
            {"academic", "Academic Performance", "Student grades and progress"},
            {"financial", "Financial Summary", "Revenue, expenses, and payments"},
            {"enrollment", "Enrollment Report", "Student enrollment statistics"},
            {"teacher", "Teacher Performance", "Teacher evaluation and metrics"},
            {"course", "Course Analytics", "Course completion and engagement"},
        };
        
        for (String[] type : reportTypes) {
            Map<String, Object> t = new HashMap<>();
            t.put("id", type[0]);
            t.put("name", type[1]);
            t.put("description", type[2]);
            types.add(t);
        }
        
        return ResponseEntity.ok(types);
    }

}
