package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.entity.TeacherDocument;
import com.lera.academy_service.repository.TeacherDocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/teacher-documents")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class TeacherDocumentController {
    
    private final TeacherDocumentRepository teacherDocumentRepository;
    private final AcademyAuthorizationService authz;

    @GetMapping
    public ResponseEntity<List<TeacherDocument>> getAllDocuments(Pageable pageable) {
        return ResponseEntity.ok(teacherDocumentRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<TeacherDocument> getDocumentById(@PathVariable UUID id) {
        return teacherDocumentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<TeacherDocument>> getDocumentsByTeacher(@PathVariable UUID teacherId) {
        authz.assertStaffOrOwnTeacherEntity(teacherId);
        return ResponseEntity.ok(teacherDocumentRepository.findByTeacherId(teacherId));
    }
    
    @GetMapping("/teacher/{teacherId}/type/{type}")
    public ResponseEntity<List<TeacherDocument>> getDocumentsByType(
            @PathVariable UUID teacherId, @PathVariable String type) {
        authz.assertStaffOrOwnTeacherEntity(teacherId);
        return ResponseEntity.ok(teacherDocumentRepository.findByTeacherIdAndDocumentType(teacherId, type));
    }
    
    @GetMapping("/teacher/{teacherId}/verified")
    public ResponseEntity<List<TeacherDocument>> getVerifiedDocuments(@PathVariable UUID teacherId) {
        authz.assertStaffOrOwnTeacherEntity(teacherId);
        return ResponseEntity.ok(teacherDocumentRepository.findByTeacherIdAndIsVerifiedTrue(teacherId));
    }
    
    @GetMapping("/expiring-before")
    public ResponseEntity<List<TeacherDocument>> getExpiringDocuments(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(teacherDocumentRepository.findByExpiryDateBefore(date));
    }
    
    @PostMapping
    public ResponseEntity<TeacherDocument> createDocument(@Valid @RequestBody TeacherDocument document) {
        return ResponseEntity.ok(teacherDocumentRepository.save(document));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<TeacherDocument> updateDocument(@PathVariable UUID id, @Valid @RequestBody TeacherDocument documentDetails) {
        return teacherDocumentRepository.findById(id).map(document -> {
            if (documentDetails.getDocumentType() != null) document.setDocumentType(documentDetails.getDocumentType());
            if (documentDetails.getDocumentName() != null) document.setDocumentName(documentDetails.getDocumentName());
            if (documentDetails.getDocumentUrl() != null) document.setDocumentUrl(documentDetails.getDocumentUrl());
            if (documentDetails.getExpiryDate() != null) document.setExpiryDate(documentDetails.getExpiryDate());
            if (documentDetails.getIsVerified() != null) document.setIsVerified(documentDetails.getIsVerified());
            return ResponseEntity.ok(teacherDocumentRepository.save(document));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PatchMapping("/{id}/verify")
    public ResponseEntity<TeacherDocument> verifyDocument(@PathVariable UUID id) {
        return teacherDocumentRepository.findById(id).map(document -> {
            document.setIsVerified(true);
            return ResponseEntity.ok(teacherDocumentRepository.save(document));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable UUID id) {
        if (teacherDocumentRepository.existsById(id)) {
            teacherDocumentRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
