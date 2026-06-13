package com.lera.academy_service.controller;

import com.lera.academy_service.entity.*;
import com.lera.academy_service.repository.*;
import com.lera.academy_service.security.AcademyAuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/students/{studentId}/profile")
@RequiredArgsConstructor
public class StudentProfileController {
    
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SessionAttendanceRepository sessionAttendanceRepository;
    private final StudentDocumentRepository studentDocumentRepository;
    private final AcademyAuthorizationService authz;
    
    /**
     * Get comprehensive student profile with all data
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getStudentProfile(@PathVariable UUID studentId) {
        authz.assertCanViewStudent(studentId);
        return studentRepository.findById(studentId)
            .map(student -> {
                Map<String, Object> profile = new HashMap<>();
                profile.put("student", student);
                
                List<Enrollment> enrollments = enrollmentRepository.findByStudentId(studentId);
                profile.put("totalEnrollments", enrollments.size());
                profile.put("activeEnrollments", enrollments.stream().filter(e -> "ACTIVE".equals(e.getStatus())).count());
                
                List<StudentDocument> documents = studentDocumentRepository.findByStudentId(studentId);
                profile.put("documentCount", documents.size());
                
                profile.put("attendanceSummary", getAttendanceSummary(studentId));
                
                return ResponseEntity.ok(profile);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/enrollments")
    public ResponseEntity<List<Enrollment>> getEnrollments(
            @PathVariable UUID studentId,
            @RequestParam(required = false) String status) {
        authz.assertCanViewStudent(studentId);
        List<Enrollment> enrollments;
        if (status != null && !status.isEmpty()) {
            enrollments = enrollmentRepository.findByStudentIdAndStatus(studentId, status);
        } else {
            enrollments = enrollmentRepository.findByStudentId(studentId);
        }
        return ResponseEntity.ok(enrollments);
    }
    
    @GetMapping("/documents")
    public ResponseEntity<List<StudentDocument>> getDocuments(@PathVariable UUID studentId) {
        authz.assertCanViewStudent(studentId);
        return ResponseEntity.ok(studentDocumentRepository.findByStudentId(studentId));
    }
    
    private Map<String, Object> getAttendanceSummary(UUID studentId) {
        Map<String, Object> summary = new HashMap<>();
        try {
            long present = sessionAttendanceRepository.countByStudentIdAndStatus(studentId, "PRESENT");
            long absent = sessionAttendanceRepository.countByStudentIdAndStatus(studentId, "ABSENT");
            long late = sessionAttendanceRepository.countByStudentIdAndStatus(studentId, "LATE");
            long excused = sessionAttendanceRepository.countByStudentIdAndStatus(studentId, "EXCUSED");
            long total = present + absent + late + excused;
            summary.put("totalSessions", total);
            summary.put("present", present);
            summary.put("absent", absent);
            summary.put("late", late);
            summary.put("excused", excused);
            summary.put("attendanceRate", total > 0 ? (double) (present + late) / total * 100 : 0);
        } catch (Exception e) {
            summary.put("totalSessions", 0);
            summary.put("present", 0);
            summary.put("absent", 0);
            summary.put("late", 0);
            summary.put("excused", 0);
            summary.put("attendanceRate", 0);
        }
        return summary;
    }
}
