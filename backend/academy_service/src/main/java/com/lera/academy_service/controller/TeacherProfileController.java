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
@RequestMapping("/api/teachers/{teacherId}/profile")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class TeacherProfileController {
    
    private final TeacherRepository teacherRepository;
    private final ClassRepository classRepository;
    private final TeacherDocumentRepository teacherDocumentRepository;
    private final EnrollmentRepository enrollmentRepository;
    
    /**
     * Get comprehensive teacher profile with all data
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getTeacherProfile(@PathVariable UUID teacherId) {
        return teacherRepository.findById(teacherId)
            .map(teacher -> {
                Map<String, Object> profile = new HashMap<>();
                profile.put("teacher", teacher);
                
                // Class stats
                List<ClassEntity> classes = classRepository.findByTeacherId(teacherId);
                profile.put("totalClasses", classes.size());
                profile.put("activeClasses", classes.stream().filter(c -> "OPEN".equals(c.getStatus()) || "ACTIVE".equals(c.getStatus())).count());
                
                // Document count
                List<TeacherDocument> documents = teacherDocumentRepository.findByTeacherId(teacherId);
                profile.put("documentCount", documents.size());
                
                // Calculate total students in teacher's classes
                long totalStudents = 0;
                for (ClassEntity cls : classes) {
                    totalStudents += enrollmentRepository.countActiveEnrollmentsByClassId(cls.getId());
                }
                profile.put("totalStudents", totalStudents);
                
                return ResponseEntity.ok(profile);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get teacher's classes with history
     */
    @GetMapping("/classes")
    public ResponseEntity<List<ClassEntity>> getClasses(
            @PathVariable UUID teacherId,
            @RequestParam(required = false) String status) {
        
        List<ClassEntity> classes = classRepository.findByTeacherId(teacherId);
        
        if (status != null && !status.isEmpty()) {
            classes = classes.stream()
                .filter(c -> status.equals(c.getStatus()))
                .toList();
        }
        
        return ResponseEntity.ok(classes);
    }
    
    /**
     * Get teacher documents
     */
    @GetMapping("/documents")
    public ResponseEntity<List<TeacherDocument>> getDocuments(@PathVariable UUID teacherId) {
        return ResponseEntity.ok(teacherDocumentRepository.findByTeacherId(teacherId));
    }
}
