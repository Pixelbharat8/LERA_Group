package com.lera.academy_service.controller;

import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.service.ClassService;
import com.lera.academy_service.repository.ClassRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClassController {
    
    private final ClassService classService;
    private final ClassRepository classRepository;
    private final AcademyAuthorizationService authz;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    /**
     * A class row carries only teacherId / programId / levelId, but every screen that lists
     * classes shows the teacher's name, the course name and the number of students enrolled.
     * Those three rendered blank (and the count as 0) on the chairman and academy centre pages,
     * on a user's profile, and on the PARENT'S SCHEDULE — a parent looking at their child's
     * timetable saw the times but neither the course nor the teacher.
     *
     * Three batched queries for the whole page, never one per row. Mirrors
     * AttendanceController#withNames, which exists for exactly this reason.
     */
    private List<ClassEntity> withDisplayNames(List<ClassEntity> classes) {
        if (classes == null || classes.isEmpty()) return classes;

        List<UUID> teacherIds = classes.stream().map(ClassEntity::getTeacherId)
                .filter(java.util.Objects::nonNull).distinct().toList();
        Map<UUID, String> teacherNames = new java.util.HashMap<>();
        if (!teacherIds.isEmpty()) {
            String ph = teacherIds.stream().map(x -> "?").collect(java.util.stream.Collectors.joining(","));
            jdbcTemplate.query("SELECT id, display_name FROM teachers WHERE id IN (" + ph + ")",
                    (java.sql.ResultSet rs) -> {
                        teacherNames.put(rs.getObject("id", UUID.class), rs.getString("display_name"));
                    }, teacherIds.toArray());
        }

        List<UUID> programIds = classes.stream().map(ClassEntity::getProgramId)
                .filter(java.util.Objects::nonNull).distinct().toList();
        Map<UUID, String> programNames = new java.util.HashMap<>();
        if (!programIds.isEmpty()) {
            String ph = programIds.stream().map(x -> "?").collect(java.util.stream.Collectors.joining(","));
            jdbcTemplate.query("SELECT id, name FROM course_programs WHERE id IN (" + ph + ")",
                    (java.sql.ResultSet rs) -> {
                        programNames.put(rs.getObject("id", UUID.class), rs.getString("name"));
                    }, programIds.toArray());
        }

        List<UUID> classIds = classes.stream().map(ClassEntity::getId)
                .filter(java.util.Objects::nonNull).distinct().toList();
        Map<UUID, Integer> counts = new java.util.HashMap<>();
        if (!classIds.isEmpty()) {
            String ph = classIds.stream().map(x -> "?").collect(java.util.stream.Collectors.joining(","));
            jdbcTemplate.query(
                    "SELECT class_id, COUNT(*) AS n FROM enrollments WHERE class_id IN (" + ph + ")"
                            + " AND (status IS NULL OR UPPER(status) NOT IN ('WITHDRAWN','DROPPED'))"
                            + " GROUP BY class_id",
                    (java.sql.ResultSet rs) -> {
                        counts.put(rs.getObject("class_id", UUID.class), rs.getInt("n"));
                    }, classIds.toArray());
        }

        for (ClassEntity c : classes) {
            c.setTeacherName(teacherNames.get(c.getTeacherId()));
            c.setProgramName(programNames.get(c.getProgramId()));
            c.setStudentCount(counts.getOrDefault(c.getId(), 0));
        }
        return classes;
    }
    
    @GetMapping
    public ResponseEntity<List<ClassEntity>> getAllClasses(
            @RequestParam(required = false) UUID centerId,
            @RequestParam(required = false) UUID teacherId,
            @RequestParam(required = false) UUID taId,
            @RequestParam(required = false) UUID programId,
            @RequestParam(required = false) String status) {
        if (teacherId != null) {
            authz.assertStaffOrOwnTeacherEntity(teacherId);
            return ResponseEntity.ok(withDisplayNames(classService.findByTeacherId(teacherId)));
        }
        if (taId != null) {
            authz.assertStaffOrOwnTeacherEntity(taId);
            return ResponseEntity.ok(withDisplayNames(classRepository.findByAssistantTeacherId(taId)));
        }
        if (programId != null) {
            authz.assertStaff();
            return ResponseEntity.ok(withDisplayNames(classService.findByProgramId(programId)));
        }
        UUID effCenter = authz.effectiveListCenterId(centerId);
        if (effCenter != null) {
            return ResponseEntity.ok(withDisplayNames(classService.findByCenterId(effCenter)));
        }
        authz.assertStaff();
        if (!authz.isOrgWide()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "centerId is required for class list queries unless you have an org-wide role");
        }
        return ResponseEntity.ok(withDisplayNames(classService.findAll()));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ClassEntity> getClassById(@PathVariable UUID id) {
        authz.assertCanViewClassRoster(id);
        return classService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/center/{centerId}")
    public ResponseEntity<List<ClassEntity>> getClassesByCenter(@PathVariable UUID centerId) {
        authz.assertStaffOrCenter(centerId);
        return ResponseEntity.ok(classService.findByCenterId(centerId));
    }
    
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<ClassEntity>> getClassesByTeacher(@PathVariable UUID teacherId) {
        authz.assertStaffOrOwnTeacherEntity(teacherId);
        return ResponseEntity.ok(classService.findByTeacherId(teacherId));
    }
    
    @GetMapping("/program/{programId}")
    public ResponseEntity<List<ClassEntity>> getClassesByProgram(@PathVariable UUID programId) {
        authz.assertStaff();
        return ResponseEntity.ok(classService.findByProgramId(programId));
    }
    
    @GetMapping("/center/{centerId}/available")
    public ResponseEntity<List<ClassEntity>> getAvailableClasses(@PathVariable UUID centerId) {
        authz.assertStaffOrCenter(centerId);
        return ResponseEntity.ok(classService.findAvailable(centerId));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<ClassEntity> createClass(@Valid @RequestBody ClassEntity classEntity) {
        return ResponseEntity.ok(classService.create(classEntity));
    }
    
    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<List<ClassEntity>> createClassesBulk(@Valid @RequestBody List<ClassEntity> classes) {
        List<ClassEntity> saved = new ArrayList<>();
        classes.forEach(c -> saved.add(classService.create(c)));
        return ResponseEntity.ok(saved);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<ClassEntity> updateClass(@PathVariable UUID id, @Valid @RequestBody ClassEntity classDetails) {
        ClassEntity existing = classRepository.findById(id).orElse(null);
        if (existing == null) return ResponseEntity.notFound().build();
        // Centre-scoped managers may only edit classes in their centre, and may not move a class
        // to another centre they don't control.
        authz.assertCanAccessCenter(existing.getCenterId());
        if (classDetails.getCenterId() != null) authz.assertCanAccessCenter(classDetails.getCenterId());
        return classService.update(id, classDetails)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER')")
    public ResponseEntity<Void> deleteClass(@PathVariable UUID id) {
        ClassEntity existing = classRepository.findById(id).orElse(null);
        if (existing == null) return ResponseEntity.notFound().build();
        authz.assertCanAccessCenter(existing.getCenterId());
        if (classService.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<ClassEntity> updateClassStatus(@PathVariable UUID id, @RequestParam String status) {
        ClassEntity existing = classRepository.findById(id).orElse(null);
        if (existing == null) return ResponseEntity.notFound().build();
        authz.assertCanAccessCenter(existing.getCenterId());
        return classService.updateStatus(id, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
