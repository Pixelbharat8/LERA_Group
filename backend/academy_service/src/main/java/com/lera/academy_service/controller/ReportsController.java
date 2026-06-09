package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.service.CentreSummaryService;
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

    /**
     * Live aggregates for a centre (students, classes, revenue, attendance) — JSON pack for dashboards / exports.
     */
    @GetMapping("/centre-summary")
    public ResponseEntity<Map<String, Object>> getCentreSummary(@RequestParam UUID centerId) {
        UUID eff = authz.effectiveListCenterId(centerId);   // 403 if a centre-bound caller requests another centre
        return ResponseEntity.ok(centreSummaryService.buildCentrePack(eff));
    }

    // Get all available reports
    @GetMapping
    public ResponseEntity<?> getAllReports(
            @RequestParam(required = false) UUID centerId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status) {
        
        return ResponseEntity.ok(generateSampleReports());
    }

    // Get specific report
    @GetMapping("/{reportId}")
    public ResponseEntity<?> getReportById(@PathVariable UUID reportId) {
        Map<String, Object> report = new HashMap<>();
        report.put("id", reportId.toString());
        report.put("name", "Monthly Performance Report");
        report.put("type", "performance");
        report.put("status", "completed");
        report.put("generatedAt", LocalDateTime.now().minusDays(1).toString());
        report.put("data", generateSampleReportData());
        return ResponseEntity.ok(report);
    }

    // Generate a new report
    @PostMapping("/generate")
    public ResponseEntity<?> generateReport(@Valid @RequestBody Map<String, Object> request) {
        String reportType = (String) request.getOrDefault("type", "summary");
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", UUID.randomUUID().toString());
        response.put("name", "Generated " + reportType + " Report");
        response.put("type", reportType);
        response.put("status", "generating");
        response.put("createdAt", LocalDateTime.now().toString());
        response.put("estimatedCompletionTime", "2 minutes");
        
        return ResponseEntity.ok(response);
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

    private List<Map<String, Object>> generateSampleReports() {
        List<Map<String, Object>> reports = new ArrayList<>();
        
        String[][] sampleReports = {
            {"Monthly Attendance Report", "attendance", "completed", "Feb 2026"},
            {"Q1 Financial Summary", "financial", "completed", "Jan 2026"},
            {"Student Progress Report", "academic", "completed", "Feb 2026"},
            {"Enrollment Statistics", "enrollment", "completed", "Feb 2026"},
            {"Teacher Evaluation", "teacher", "pending", "Feb 2026"},
            {"Course Completion Report", "course", "generating", "Feb 2026"},
        };
        
        for (int i = 0; i < sampleReports.length; i++) {
            Map<String, Object> report = new HashMap<>();
            report.put("id", UUID.randomUUID().toString());
            report.put("name", sampleReports[i][0]);
            report.put("type", sampleReports[i][1]);
            report.put("status", sampleReports[i][2]);
            report.put("period", sampleReports[i][3]);
            report.put("generatedAt", LocalDateTime.now().minusDays(i + 1).toString());
            reports.add(report);
        }
        
        return reports;
    }

    private Map<String, Object> generateSampleReportData() {
        Map<String, Object> data = new HashMap<>();
        
        // Summary stats
        data.put("totalStudents", 450);
        data.put("totalTeachers", 32);
        data.put("totalCourses", 24);
        data.put("averageAttendance", 94.5);
        data.put("revenue", 125000000);
        
        // Charts data
        List<Map<String, Object>> monthlyData = new ArrayList<>();
        String[] months = {"Sep", "Oct", "Nov", "Dec", "Jan", "Feb"};
        int[] students = {380, 395, 410, 425, 440, 450};
        
        for (int i = 0; i < months.length; i++) {
            Map<String, Object> point = new HashMap<>();
            point.put("month", months[i]);
            point.put("students", students[i]);
            point.put("revenue", 18000000 + (i * 2000000));
            monthlyData.add(point);
        }
        data.put("monthlyTrend", monthlyData);
        
        return data;
    }
}
