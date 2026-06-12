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

import java.util.List;
import java.util.UUID;

/**
 * Alias controller for {@code /api/parent-students} — same authorization rules as
 * {@link StudentParentController} ({@code /api/student-parents}).
 */
@RestController
@RequestMapping("/api/parent-students")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF','STUDENT','PARENT')")
public class ParentStudentController {
    
    private final StudentParentRepository studentParentRepository;
    private final StudentParentAccessPolicy studentParentAccessPolicy;
    private final AcademyAuthorizationService authz;

    @GetMapping
    public ResponseEntity<List<StudentParent>> getParentStudents(
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
    
    @GetMapping("/parent/{parentId}")
    public ResponseEntity<List<StudentParent>> getByParent(@PathVariable UUID parentId) {
        if (!CurrentUser.isSelfOrStaff(parentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(studentParentRepository.findByParentId(parentId));
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<StudentParent>> getByStudent(@PathVariable UUID studentId) {
        if (!studentParentAccessPolicy.canAccessStudentLinkData(studentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(studentParentRepository.findByStudentId(studentId));
    }
}
