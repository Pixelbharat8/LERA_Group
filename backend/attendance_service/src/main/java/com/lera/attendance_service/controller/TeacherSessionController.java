package com.lera.attendance_service.controller;

import com.lera.attendance_service.entity.TeacherSession;
import com.lera.attendance_service.service.TeacherSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/teacher-sessions")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF')")
public class TeacherSessionController {
    
    private final TeacherSessionService teacherSessionService;
    
    @GetMapping
    public ResponseEntity<List<TeacherSession>> getAllSessions(
            @RequestParam(required = false) UUID classId,
            @RequestParam(required = false) UUID teacherId) {
        if (classId != null) {
            return ResponseEntity.ok(teacherSessionService.getSessionsByClass(classId));
        }
        if (teacherId != null) {
            return ResponseEntity.ok(teacherSessionService.getSessionsByTeacher(teacherId));
        }
        return ResponseEntity.ok(teacherSessionService.getAllSessions());
    }
    
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<TeacherSession>> getSessionsByTeacher(@PathVariable UUID teacherId) {
        return ResponseEntity.ok(teacherSessionService.getSessionsByTeacher(teacherId));
    }
    
    @GetMapping("/teacher/{teacherId}/hours")
    public ResponseEntity<Map<String, Object>> getTeacherHours(
            @PathVariable UUID teacherId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        BigDecimal totalHours = teacherSessionService.getTotalHoursForPeriod(teacherId, startDate, endDate);
        List<TeacherSession> sessions = teacherSessionService.getSessionsByTeacherAndDateRange(
            teacherId, startDate, endDate
        );
        
        Map<String, Object> result = new HashMap<>();
        result.put("teacherId", teacherId);
        result.put("startDate", startDate);
        result.put("endDate", endDate);
        result.put("totalHours", totalHours);
        result.put("sessionCount", sessions.size());
        result.put("sessions", sessions);
        
        return ResponseEntity.ok(result);
    }
    
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER','TEACHER','STAFF')")
    @PostMapping
    public ResponseEntity<TeacherSession> createSession(@Valid @RequestBody TeacherSession session) {
        return ResponseEntity.ok(teacherSessionService.createSession(session));
    }
    
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER','TEACHER','STAFF')")
    @PutMapping("/{id}")
    public ResponseEntity<TeacherSession> updateSession(
            @PathVariable UUID id,
            @Valid @RequestBody TeacherSession sessionDetails) {
        try {
            TeacherSession updated = teacherSessionService.updateSession(id, sessionDetails);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
