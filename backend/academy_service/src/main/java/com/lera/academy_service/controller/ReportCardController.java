package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.service.StudentReportCardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Per-student progress report card. Visible to the student's own parent and to staff in the
 * student's centre (enforced by {@link AcademyAuthorizationService#assertCanViewStudent}).
 */
@RestController
@RequestMapping("/api/report-cards")
@PreAuthorize("isAuthenticated()")
public class ReportCardController {

    private final StudentReportCardService reportCardService;
    private final AcademyAuthorizationService authz;

    public ReportCardController(StudentReportCardService reportCardService, AcademyAuthorizationService authz) {
        this.reportCardService = reportCardService;
        this.authz = authz;
    }

    @GetMapping("/{studentId}")
    public ResponseEntity<Map<String, Object>> getReportCard(@PathVariable UUID studentId) {
        authz.assertCanViewStudent(studentId);
        return ResponseEntity.ok(reportCardService.buildReportCard(studentId));
    }
}
