package com.lera.academy_service.controller;

import com.lera.academy_service.entity.ParentProfile;
import com.lera.academy_service.entity.Student;
import com.lera.academy_service.entity.StudentParent;
import com.lera.academy_service.repository.ParentProfileRepository;
import com.lera.academy_service.repository.StudentParentRepository;
import com.lera.academy_service.repository.StudentRepository;
import com.lera.academy_service.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/parents")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF','STUDENT','PARENT')")
public class ParentProfileController {
    
    private final ParentProfileRepository parentProfileRepository;
    private final StudentParentRepository studentParentRepository;
    private final StudentRepository studentRepository;
    
    /** Current user's parent profile (JWT {@code user_id} → {@link ParentProfile}). */
    @GetMapping({"/self", "/me"})
    public ResponseEntity<ParentProfile> getParentSelf() {
        return CurrentUser.id()
                .flatMap(parentProfileRepository::findByUserId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF')")
    public ResponseEntity<List<ParentProfile>> getAllParents(Pageable pageable) {
        return ResponseEntity.ok(parentProfileRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ParentProfile> getParentById(@PathVariable UUID id) {
        return parentProfileRepository.findById(id)
                .map(profile -> {
                    if (!CurrentUser.isStaff() && !CurrentUser.id().map(profile.getUserId()::equals).orElse(false)) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
                    }
                    return profile;
                })
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<ParentProfile> getParentByUserId(@PathVariable UUID userId) {
        if (!CurrentUser.isSelfOrStaff(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return parentProfileRepository.findByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * All children linked to the given parent (by user id). Resolves the
     * many-to-many through {@code student_parents} and merges with the
     * legacy denormalized {@code Student.parentId} field so older data
     * doesn't get hidden. Each row is returned as a flat map containing
     * the student's id, full name, code, class — enough to drive the
     * parent-side UI without an N+1 follow-up fetch.
     *
     * <p>Authorization: parents can only call this for themselves; staff
     * roles can call it for any parent (used by support / admin views).
     */
    @GetMapping("/{userId}/children")
    public ResponseEntity<List<Map<String, Object>>> getChildren(@PathVariable UUID userId) {
        if (!CurrentUser.isSelfOrStaff(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        List<UUID> studentIds = studentParentRepository.findByParentId(userId).stream()
                .map(StudentParent::getStudentId)
                .collect(Collectors.toList());

        // De-duplicating LinkedHashMap so callers see a stable, ordered list
        // even when both link tables produce the same student.
        Map<UUID, Map<String, Object>> dedup = new LinkedHashMap<>();

        for (Student s : studentRepository.findAllById(studentIds)) {
            dedup.put(s.getId(), toView(s));
        }
        // Legacy: students that point at the parent directly via Student.parentId
        for (Student s : studentRepository.findByParentId(userId)) {
            dedup.putIfAbsent(s.getId(), toView(s));
        }
        return ResponseEntity.ok(List.copyOf(dedup.values()));
    }

    private static Map<String, Object> toView(Student s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("fullname", s.getFullname());
        m.put("studentCode", s.getStudentCode());
        m.put("centerId", s.getCenterId());
        m.put("status", s.getStatus());
        m.put("avatarUrl", s.getAvatarUrl());
        return m;
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF')")
    public ResponseEntity<ParentProfile> createParent(@Valid @RequestBody ParentProfile parent) {
        return ResponseEntity.ok(parentProfileRepository.save(parent));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF')")
    public ResponseEntity<ParentProfile> updateParent(@PathVariable UUID id, @Valid @RequestBody ParentProfile parentDetails) {
        return parentProfileRepository.findById(id).map(parent -> {
            if (parentDetails.getOccupation() != null) parent.setOccupation(parentDetails.getOccupation());
            if (parentDetails.getCompany() != null) parent.setCompany(parentDetails.getCompany());
            if (parentDetails.getEducationLevel() != null) parent.setEducationLevel(parentDetails.getEducationLevel());
            if (parentDetails.getPreferredContactMethod() != null) parent.setPreferredContactMethod(parentDetails.getPreferredContactMethod());
            if (parentDetails.getNotes() != null) parent.setNotes(parentDetails.getNotes());
            return ResponseEntity.ok(parentProfileRepository.save(parent));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF')")
    public ResponseEntity<Void> deleteParent(@PathVariable UUID id) {
        if (parentProfileRepository.existsById(id)) {
            parentProfileRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
