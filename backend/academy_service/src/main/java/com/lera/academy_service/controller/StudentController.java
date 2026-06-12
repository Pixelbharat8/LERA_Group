package com.lera.academy_service.controller;

import com.lera.academy_service.entity.Student;
import com.lera.academy_service.entity.Enrollment;
import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.security.CurrentUser;
import com.lera.academy_service.service.StudentService;
import com.lera.academy_service.repository.EnrollmentRepository;
import com.lera.academy_service.repository.ClassRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import java.util.Collections;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {
    
    private final StudentService studentService;
    private final EnrollmentRepository enrollmentRepository;
    private final ClassRepository classRepository;
    private final AcademyAuthorizationService authz;
    
    @GetMapping
    public ResponseEntity<List<Student>> getAllStudents(
            @RequestParam(required = false) UUID centerId) {
        UUID effCenter = authz.effectiveListCenterId(centerId);
        if (effCenter != null) {
            return ResponseEntity.ok(studentService.findByCenterId(effCenter));
        }
        authz.assertStaff();
        if (!authz.isOrgWide()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "centerId is required for student list queries unless you have an org-wide role");
        }
        return ResponseEntity.ok(studentService.findAll());
    }

    /** Current user's academy student row (JWT {@code user_id} → {@link Student}). */
    @GetMapping({"/self", "/me"})
    public ResponseEntity<Student> getStudentSelf() {
        return CurrentUser.id()
                .flatMap(studentService::findByUserId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(@PathVariable UUID id) {
        authz.assertCanViewStudent(id);
        return studentService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/code/{code}")
    public ResponseEntity<Student> getStudentByCode(@PathVariable String code) {
        return studentService.findByCode(code)
                .map(s -> {
                    authz.assertCanViewStudent(s.getId());
                    return ResponseEntity.ok(s);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/center/{centerId}")
    public ResponseEntity<List<Student>> getStudentsByCenter(@PathVariable UUID centerId) {
        authz.assertStaffOrCenter(centerId);
        return ResponseEntity.ok(studentService.findByCenterId(centerId));
    }
    
    @GetMapping("/parent/{parentId}")
    public ResponseEntity<List<Student>> getStudentsByParent(@PathVariable UUID parentId) {
        authz.assertSelfOrStaffParent(parentId);
        return ResponseEntity.ok(studentService.findByParentId(parentId));
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<Student>> searchStudents(
            @RequestParam String q,
            @RequestParam(required = false) UUID centerId) {
        authz.assertStaff();
        if (centerId != null) {
            authz.assertStaffOrCenter(centerId);
            return ResponseEntity.ok(studentService.searchInCenter(q, centerId));
        }
        return ResponseEntity.ok(studentService.search(q));
    }
    
    @GetMapping("/center/{centerId}/count")
    public ResponseEntity<Long> countStudentsByCenter(@PathVariable UUID centerId) {
        authz.assertStaffOrCenter(centerId);
        return ResponseEntity.ok(studentService.countByCenterId(centerId));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<Student> createStudent(@Valid @RequestBody Student student) {
        return ResponseEntity.ok(studentService.create(student));
    }
    
    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<List<Student>> createStudentsBulk(@Valid @RequestBody List<Student> students) {
        List<Student> savedStudents = studentService.createBulk(students);
        return ResponseEntity.ok(savedStudents);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<Student> updateStudent(@PathVariable UUID id, @Valid @RequestBody Student studentDetails) {
        return studentService.update(id, studentDetails)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER')")
    public ResponseEntity<Void> deleteStudent(@PathVariable UUID id) {
        if (studentService.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<Student> updateStudentStatus(@PathVariable UUID id, @RequestParam String status) {
        return studentService.updateStatus(id, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Student detail sub-resources - used by the student profile page
     */
    @GetMapping("/{id}/attendance-stats")
    public ResponseEntity<Map<String, Object>> getStudentAttendanceStats(
            @PathVariable UUID id,
            @RequestParam(required = false, defaultValue = "30d") String period) {
        authz.assertCanViewStudent(id);
        if (studentService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Map<String, Object> stats = new HashMap<>();
        stats.put("studentId", id);
        stats.put("period", period);
        stats.put("totalDays", 0);
        stats.put("presentDays", 0);
        stats.put("absentDays", 0);
        stats.put("lateDays", 0);
        stats.put("attendanceRate", 0);
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/{id}/class-history")
    public ResponseEntity<List<Map<String, Object>>> getStudentClassHistory(@PathVariable UUID id) {
        authz.assertCanViewStudent(id);
        if (studentService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(id);
        List<Map<String, Object>> history = enrollments.stream().map(enrollment -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("id", enrollment.getId());
            entry.put("classId", enrollment.getClassId());
            entry.put("enrollmentDate", enrollment.getEnrollmentDate());
            entry.put("startDate", enrollment.getStartDate());
            entry.put("endDate", enrollment.getEndDate());
            entry.put("status", enrollment.getStatus());
            if (enrollment.getClassId() != null) {
                classRepository.findById(enrollment.getClassId()).ifPresent(cls -> {
                    entry.put("className", cls.getName());
                    entry.put("classCode", cls.getName());
                    entry.put("teacherId", cls.getTeacherId());
                    entry.put("room", cls.getRoom());
                });
            }
            return entry;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(history);
    }
    
    @GetMapping("/{id}/payments")
    public ResponseEntity<List<Map<String, Object>>> getStudentPayments(@PathVariable UUID id) {
        authz.assertCanViewStudent(id);
        if (studentService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Collections.emptyList());
    }
    
    @GetMapping("/{id}/files")
    public ResponseEntity<List<Map<String, Object>>> getStudentFiles(@PathVariable UUID id) {
        authz.assertCanViewStudent(id);
        if (studentService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Collections.emptyList());
    }
    
    @GetMapping("/{id}/referrals")
    public ResponseEntity<List<Map<String, Object>>> getStudentReferrals(@PathVariable UUID id) {
        authz.assertCanViewStudent(id);
        if (studentService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/{id}/enrollments")
    public ResponseEntity<List<Enrollment>> getStudentEnrollments(@PathVariable UUID id) {
        authz.assertCanViewStudent(id);
        if (studentService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(enrollmentRepository.findByStudentId(id));
    }
}
