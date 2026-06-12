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
    
    @GetMapping
    public ResponseEntity<List<ClassEntity>> getAllClasses(
            @RequestParam(required = false) UUID centerId,
            @RequestParam(required = false) UUID teacherId,
            @RequestParam(required = false) UUID taId,
            @RequestParam(required = false) UUID programId,
            @RequestParam(required = false) String status) {
        if (teacherId != null) {
            authz.assertStaffOrOwnTeacherEntity(teacherId);
            return ResponseEntity.ok(classService.findByTeacherId(teacherId));
        }
        if (taId != null) {
            authz.assertStaffOrOwnTeacherEntity(taId);
            return ResponseEntity.ok(classRepository.findByAssistantTeacherId(taId));
        }
        if (programId != null) {
            authz.assertStaff();
            return ResponseEntity.ok(classService.findByProgramId(programId));
        }
        UUID effCenter = authz.effectiveListCenterId(centerId);
        if (effCenter != null) {
            return ResponseEntity.ok(classService.findByCenterId(effCenter));
        }
        authz.assertStaff();
        if (!authz.isOrgWide()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "centerId is required for class list queries unless you have an org-wide role");
        }
        return ResponseEntity.ok(classService.findAll());
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
        return classService.update(id, classDetails)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER')")
    public ResponseEntity<Void> deleteClass(@PathVariable UUID id) {
        if (classService.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<ClassEntity> updateClassStatus(@PathVariable UUID id, @RequestParam String status) {
        return classService.updateStatus(id, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
