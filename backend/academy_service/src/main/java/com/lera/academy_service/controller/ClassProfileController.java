package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.*;
import com.lera.academy_service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/classes/{classId}/profile")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class ClassProfileController {
    
    private final ClassRepository classRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ClassSessionRepository classSessionRepository;
    private final AssignmentRepository assignmentRepository;
    private final SessionAttendanceRepository sessionAttendanceRepository;
    private final ExamRepository examRepository;
    
    /**
     * Get comprehensive class profile with all data
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getClassProfile(@PathVariable UUID classId) {
        return classRepository.findById(classId)
            .map(classEntity -> {
                Map<String, Object> profile = new HashMap<>();
                profile.put("class", classEntity);
                
                // Enrollment stats
                long activeEnrollments = enrollmentRepository.countActiveEnrollmentsByClassId(classId);
                profile.put("activeEnrollments", activeEnrollments);
                
                // Session stats
                List<ClassSession> sessions = classSessionRepository.findByClassId(classId);
                long completedSessions = sessions.stream().filter(s -> "COMPLETED".equals(s.getStatus())).count();
                long scheduledSessions = sessions.stream().filter(s -> "SCHEDULED".equals(s.getStatus())).count();
                
                profile.put("totalSessions", sessions.size());
                profile.put("completedSessions", completedSessions);
                profile.put("scheduledSessions", scheduledSessions);

                profile.put("assignmentCount", assignmentRepository.findByClassId(classId).size());
                profile.put(
                        "homeworkCount",
                        assignmentRepository.findByClassIdAndAssignmentType(classId, "HOMEWORK").size());
                profile.put("examCount", examRepository.findByClassId(classId).size());

                List<Enrollment> enrollments = enrollmentRepository.findByClassId(classId);
                List<UUID> sessionIds = sessions.stream().map(ClassSession::getId).toList();
                long lowAttendanceDays = 0;
                if (activeEnrollments > 0 && !sessionIds.isEmpty()) {
                    for (UUID sessionId : sessionIds) {
                        long present = sessionAttendanceRepository.findBySessionId(sessionId).stream()
                                .filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus()))
                                .count();
                        if (present * 2 < activeEnrollments) {
                            lowAttendanceDays++;
                        }
                    }
                }
                profile.put("lowAttendanceDays", lowAttendanceDays);

                int studentsAtRisk = 0;
                if (!sessionIds.isEmpty()) {
                    int sessionCount = sessionIds.size();
                    for (Enrollment enrollment : enrollments) {
                        if (!"ACTIVE".equalsIgnoreCase(enrollment.getStatus())) {
                            continue;
                        }
                        long presentSessions = sessionIds.stream()
                                .filter(sessionId -> sessionAttendanceRepository
                                        .findBySessionIdAndStudentId(sessionId, enrollment.getStudentId())
                                        .map(a -> "PRESENT".equalsIgnoreCase(a.getStatus())
                                                || "LATE".equalsIgnoreCase(a.getStatus()))
                                        .orElse(false))
                                .count();
                        if (presentSessions * 100L / sessionCount < 80L) {
                            studentsAtRisk++;
                        }
                    }
                }
                profile.put("studentsAtRisk", studentsAtRisk);

                return ResponseEntity.ok(profile);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get enrolled students in a class
     */
    @GetMapping("/students")
    public ResponseEntity<List<Enrollment>> getEnrolledStudents(
            @PathVariable UUID classId,
            @RequestParam(required = false) String status) {
        
        List<Enrollment> enrollments = enrollmentRepository.findByClassId(classId);
        
        if (status != null && !status.isEmpty()) {
            enrollments = enrollments.stream()
                .filter(e -> status.equals(e.getStatus()))
                .toList();
        }
        
        return ResponseEntity.ok(enrollments);
    }
    
    /**
     * Get class sessions
     */
    @GetMapping("/sessions")
    public ResponseEntity<List<ClassSession>> getSessions(
            @PathVariable UUID classId,
            @RequestParam(required = false) String status) {
        
        List<ClassSession> sessions = classSessionRepository.findByClassId(classId);
        
        if (status != null && !status.isEmpty()) {
            sessions = sessions.stream()
                .filter(s -> status.equals(s.getStatus()))
                .toList();
        }
        
        return ResponseEntity.ok(sessions);
    }
}
