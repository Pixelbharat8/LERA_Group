package com.lera.academy_service.controller;

import com.lera.academy_service.entity.Teacher;
import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.entity.Enrollment;
import com.lera.academy_service.entity.Student;
import com.lera.academy_service.service.TeacherService;
import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.security.CurrentUser;
import com.lera.academy_service.repository.ClassRepository;
import com.lera.academy_service.repository.EnrollmentRepository;
import com.lera.academy_service.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/teachers")
@RequiredArgsConstructor
public class TeacherController {
    
    private final TeacherService teacherService;
    private final ClassRepository classRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final AcademyAuthorizationService authz;
    
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('TEACHER','TEACHING_ASSISTANT','TA','SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','STAFF')")
    public ResponseEntity<Teacher> getCurrentTeacher() {
        UUID userId = CurrentUser.id()
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.UNAUTHORIZED, "Authentication required"));
        return teacherService
                .findByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<Teacher>> getAllTeachers(
            @RequestParam(required = false) UUID centerId) {
        UUID effCenter = authz.effectiveListCenterId(centerId);
        if (effCenter != null) {
            return ResponseEntity.ok(teacherService.findByCenterId(effCenter));
        }
        authz.assertStaff();
        if (!authz.isOrgWide()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "centerId is required for teacher list queries unless you have an org-wide role");
        }
        return ResponseEntity.ok(teacherService.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Teacher> getTeacherById(@PathVariable UUID id) {
        authz.assertCanViewTeacherProfile(id);
        return teacherService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/code/{code}")
    public ResponseEntity<Teacher> getTeacherByCode(@PathVariable String code) {
        return teacherService.findByCode(code)
                .map(t -> {
                    authz.assertCanViewTeacherProfile(t.getId());
                    return ResponseEntity.ok(t);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/center/{centerId}")
    public ResponseEntity<List<Teacher>> getTeachersByCenter(@PathVariable UUID centerId) {
        authz.assertStaffOrCenter(centerId);
        return ResponseEntity.ok(teacherService.findByCenterId(centerId));
    }
    
    @GetMapping("/featured")
    public ResponseEntity<List<Teacher>> getFeaturedTeachers() {
        return ResponseEntity.ok(teacherService.findFeatured());
    }
    
    @GetMapping("/center/{centerId}/count")
    public ResponseEntity<Long> countTeachersByCenter(@PathVariable UUID centerId) {
        authz.assertStaffOrCenter(centerId);
        return ResponseEntity.ok(teacherService.countByCenterId(centerId));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER')")
    public ResponseEntity<Teacher> createTeacher(@Valid @RequestBody Teacher teacher) {
        return ResponseEntity.ok(teacherService.create(teacher));
    }
    
    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER')")
    public ResponseEntity<List<Teacher>> createTeachersBulk(@Valid @RequestBody List<Teacher> teachers) {
        // Bulk via service
        List<Teacher> saved = new ArrayList<>();
        teachers.forEach(t -> saved.add(teacherService.create(t)));
        return ResponseEntity.ok(saved);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER')")
    public ResponseEntity<Teacher> updateTeacher(@PathVariable UUID id, @Valid @RequestBody Teacher teacherDetails) {
        return teacherService.update(id, teacherDetails)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Void> deleteTeacher(@PathVariable UUID id) {
        if (teacherService.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    /**
     * Teacher detail sub-resources - used by the teacher profile page
     */
    @GetMapping("/{id}/attendance-stats")
    public ResponseEntity<Map<String, Object>> getTeacherAttendanceStats(
            @PathVariable UUID id,
            @RequestParam(required = false, defaultValue = "30d") String period) {
        authz.assertCanViewTeacherProfile(id);
        if (teacherService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Map<String, Object> stats = new HashMap<>();
        stats.put("teacherId", id);
        stats.put("period", period);
        stats.put("totalDays", 0);
        stats.put("presentDays", 0);
        stats.put("absentDays", 0);
        stats.put("attendanceRate", 0);
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/{id}/classes")
    public ResponseEntity<List<Map<String, Object>>> getTeacherClasses(@PathVariable UUID id) {
        authz.assertCanViewTeacherProfile(id);
        if (teacherService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        List<ClassEntity> teacherClasses = classRepository.findByTeacherId(id);
        List<Map<String, Object>> result = teacherClasses.stream().map(c -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("classId", c.getId());
            entry.put("className", c.getName());
            entry.put("room", c.getRoom());
            entry.put("scheduleDays", c.getScheduleDays());
            entry.put("scheduleTimeStart", c.getScheduleTimeStart());
            entry.put("scheduleTimeEnd", c.getScheduleTimeEnd());
            entry.put("maxStudents", c.getMaxStudents());
            entry.put("status", c.getStatus());
            entry.put("startDate", c.getStartDate());
            entry.put("endDate", c.getEndDate());
            long enrolled = enrollmentRepository.countActiveEnrollmentsByClassId(c.getId());
            entry.put("enrolledCount", enrolled);
            return entry;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/{id}/payroll")
    public ResponseEntity<List<Map<String, Object>>> getTeacherPayroll(
            @PathVariable UUID id,
            @RequestParam(required = false, defaultValue = "30d") String period) {
        authz.assertStaff();
        if (teacherService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Collections.emptyList());
    }
    
    /**
     * Aggregated performance KPIs for a teacher — used by the teacher detail page.
     * Returns derived metrics (class count, student count, retention, etc.).
     * Heavier metrics (NPS, satisfaction surveys) are returned as nulls until
     * the underlying surveys/feedback service exposes them.
     */
    @GetMapping("/{id}/performance")
    public ResponseEntity<Map<String, Object>> getTeacherPerformance(
            @PathVariable UUID id,
            @RequestParam(required = false, defaultValue = "30d") String period) {
        authz.assertCanViewTeacherProfile(id);
        if (teacherService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        List<ClassEntity> teacherClasses = classRepository.findByTeacherId(id);
        long activeStudents = 0;
        long totalEnrollments = 0;
        for (ClassEntity cls : teacherClasses) {
            List<Enrollment> enrollments = enrollmentRepository.findByClassId(cls.getId());
            totalEnrollments += enrollments.size();
            activeStudents += enrollments.stream()
                    .filter(e -> "ACTIVE".equals(e.getStatus()))
                    .count();
        }
        Map<String, Object> performance = new HashMap<>();
        performance.put("teacherId", id);
        performance.put("period", period);
        performance.put("classCount", teacherClasses.size());
        performance.put("activeStudents", activeStudents);
        performance.put("totalEnrollments", totalEnrollments);
        performance.put("retentionRate", totalEnrollments == 0 ? 0
                : Math.round(((double) activeStudents / totalEnrollments) * 1000.0) / 10.0);
        // Placeholders for survey-driven metrics (not yet backed by data).
        performance.put("npsScore", null);
        performance.put("satisfactionScore", null);
        performance.put("punctualityRate", null);
        return ResponseEntity.ok(performance);
    }

    @GetMapping("/{id}/students")
    public ResponseEntity<List<Map<String, Object>>> getTeacherStudents(@PathVariable UUID id) {
        authz.assertCanViewTeacherProfile(id);
        if (teacherService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        // Get all classes taught by this teacher, then get enrolled students
        List<ClassEntity> teacherClasses = classRepository.findByTeacherId(id);
        Set<UUID> studentIds = new HashSet<>();
        Map<UUID, String> studentClassNames = new HashMap<>();
        for (ClassEntity cls : teacherClasses) {
            List<Enrollment> enrollments = enrollmentRepository.findByClassId(cls.getId());
            for (Enrollment e : enrollments) {
                if ("ACTIVE".equals(e.getStatus()) && e.getStudentId() != null) {
                    studentIds.add(e.getStudentId());
                    studentClassNames.put(e.getStudentId(), cls.getName());
                }
            }
        }
        List<Student> students = studentRepository.findAllById(studentIds);
        List<Map<String, Object>> result = students.stream().map(s -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("studentId", s.getId());
            entry.put("fullname", s.getFullname());
            entry.put("studentCode", s.getStudentCode());
            entry.put("email", s.getEmail());
            entry.put("phone", s.getPhone());
            entry.put("status", s.getStatus());
            entry.put("className", studentClassNames.get(s.getId()));
            return entry;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
