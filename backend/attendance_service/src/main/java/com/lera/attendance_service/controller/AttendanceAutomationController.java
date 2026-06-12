package com.lera.attendance_service.controller;

import com.lera.attendance_service.model.ApiResponse;
import com.lera.attendance_service.service.AttendanceAutomationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

/**
 * Controller for attendance automation management
 */
@RestController
@RequestMapping("/api/attendance/automation")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF','STUDENT','PARENT')")
public class AttendanceAutomationController {

    private final AttendanceAutomationService automationService;

    /**
     * Get automation status and statistics
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAutomationStatus() {
        log.info("Getting automation status");
        
        Map<String, Object> status = automationService.getAutomationStatus();
        
        return ResponseEntity.ok(ApiResponse.ok(status));
    }

    /**
     * Manually trigger absent marking for a specific date
     */
    @PostMapping("/mark-absent")
    public ResponseEntity<ApiResponse<Map<String, Object>>> markAbsent(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        if (date == null) {
            date = LocalDate.now();
        }
        
        log.info("Manual absent marking triggered for {}", date);
        
        int count = automationService.markAbsentForDate(date);
        
        Map<String, Object> result = Map.of(
            "date", date.toString(),
            "studentsMarkedAbsent", count,
            "message", "Successfully marked " + count + " students as absent"
        );
        
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Manually trigger all daily automation tasks
     */
    @PostMapping("/run-daily-tasks")
    public ResponseEntity<ApiResponse<Map<String, Object>>> runDailyTasks() {
        log.info("Manual trigger of all daily automation tasks");
        
        try {
            automationService.createDailyAttendanceSessions();
            automationService.flagLateArrivals();
            automationService.closeOpenAttendanceSessions();
            automationService.markAbsentStudentsDaily();
            
            Map<String, Object> result = Map.of(
                "date", LocalDate.now().toString(),
                "tasksExecuted", 4,
                "tasks", java.util.List.of(
                    "Create Daily Sessions",
                    "Flag Late Arrivals", 
                    "Close Open Sessions",
                    "Mark Absent Students"
                ),
                "status", "SUCCESS"
            );
            
            return ResponseEntity.ok(ApiResponse.ok(result));
            
        } catch (Exception e) {
            log.error("Error running daily tasks: {}", "An unexpected error occurred", e);
            return ResponseEntity.internalServerError()
                .body(new ApiResponse<>(false, "An error occurred running daily tasks", null));
        }
    }

    /**
     * Manually trigger weekly stats calculation
     */
    @PostMapping("/calculate-weekly-stats")
    public ResponseEntity<ApiResponse<String>> calculateWeeklyStats() {
        log.info("Manual trigger of weekly stats calculation");
        
        try {
            automationService.calculateWeeklyAttendanceStats();
            return ResponseEntity.ok(ApiResponse.ok("Weekly stats calculated successfully"));
        } catch (Exception e) {
            log.error("Error calculating weekly stats: {}", "An unexpected error occurred", e);
            return ResponseEntity.internalServerError()
                .body(new ApiResponse<>(false, "An unexpected error occurred", null));
        }
    }

    /**
     * Manually trigger monthly reports generation
     */
    @PostMapping("/generate-monthly-reports")
    public ResponseEntity<ApiResponse<String>> generateMonthlyReports() {
        log.info("Manual trigger of monthly reports generation");
        
        try {
            automationService.generateMonthlyAttendanceReports();
            return ResponseEntity.ok(ApiResponse.ok("Monthly reports generated successfully"));
        } catch (Exception e) {
            log.error("Error generating monthly reports: {}", "An unexpected error occurred", e);
            return ResponseEntity.internalServerError()
                .body(new ApiResponse<>(false, "An unexpected error occurred", null));
        }
    }
}
