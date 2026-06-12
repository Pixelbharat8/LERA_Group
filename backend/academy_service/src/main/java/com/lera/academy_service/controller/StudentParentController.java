package com.lera.academy_service.controller;

import com.lera.academy_service.entity.StudentParent;
import com.lera.academy_service.repository.StudentParentRepository;
import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.security.CurrentUser;
import com.lera.academy_service.security.StudentParentAccessPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/student-parents")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF','STUDENT','PARENT')")
public class StudentParentController {
    
    private final StudentParentRepository studentParentRepository;
    private final StudentParentAccessPolicy studentParentAccessPolicy;
    private final AcademyAuthorizationService authz;
    
    @GetMapping
    public ResponseEntity<List<StudentParent>> getAll(
            @RequestParam(required = false) UUID parentId,
            @RequestParam(required = false) UUID studentId) {
        if (parentId != null) {
            if (!CurrentUser.isSelfOrStaff(parentId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
            return ResponseEntity.ok(studentParentRepository.findByParentId(parentId));
        }
        if (studentId != null) {
            if (!studentParentAccessPolicy.canAccessStudentLinkData(studentId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
            return ResponseEntity.ok(studentParentRepository.findByStudentId(studentId));
        }
        if (!CurrentUser.isStaff()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (!authz.isOrgWide()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "parentId or studentId is required unless you have an org-wide role");
        }
        return ResponseEntity.ok(studentParentRepository.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<StudentParent> getById(@PathVariable UUID id) {
        return studentParentRepository.findById(id)
                .map(sp -> {
                    if (!studentParentAccessPolicy.canAccessStudentParentRow(sp)) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
                    }
                    return sp;
                })
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<StudentParent>> getByStudent(@PathVariable UUID studentId) {
        if (!studentParentAccessPolicy.canAccessStudentLinkData(studentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(studentParentRepository.findByStudentId(studentId));
    }
    
    @GetMapping("/parent/{parentId}")
    public ResponseEntity<List<StudentParent>> getByParent(@PathVariable UUID parentId) {
        if (!CurrentUser.isSelfOrStaff(parentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(studentParentRepository.findByParentId(parentId));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF')")
    public ResponseEntity<StudentParent> create(@Valid @RequestBody StudentParent studentParent) {
        return ResponseEntity.ok(studentParentRepository.save(studentParent));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF')")
    public ResponseEntity<StudentParent> update(@PathVariable UUID id, @Valid @RequestBody StudentParent details) {
        return studentParentRepository.findById(id).map(sp -> {
            if (details.getRelationship() != null) sp.setRelationship(details.getRelationship());
            if (details.getIsPrimary() != null) sp.setIsPrimary(details.getIsPrimary());
            return ResponseEntity.ok(studentParentRepository.save(sp));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (studentParentRepository.existsById(id)) {
            studentParentRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
