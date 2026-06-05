package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.entity.StudentDocument;
import com.lera.academy_service.repository.StudentDocumentRepository;
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
@RequestMapping("/api/student-documents")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class StudentDocumentController {
    
    private final StudentDocumentRepository studentDocumentRepository;
    private final AcademyAuthorizationService authz;

    @GetMapping
    public ResponseEntity<List<StudentDocument>> getAllDocuments(Pageable pageable) {
        return ResponseEntity.ok(studentDocumentRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<StudentDocument> getDocumentById(@PathVariable UUID id) {
        return studentDocumentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<StudentDocument>> getDocumentsByStudent(@PathVariable UUID studentId) {
        authz.assertCanViewStudent(studentId);
        return ResponseEntity.ok(studentDocumentRepository.findByStudentId(studentId));
    }
    
    @GetMapping("/student/{studentId}/type/{type}")
    public ResponseEntity<List<StudentDocument>> getDocumentsByStudentAndType(
            @PathVariable UUID studentId, 
            @PathVariable String type) {
        authz.assertCanViewStudent(studentId);
        return ResponseEntity.ok(studentDocumentRepository.findByStudentIdAndDocumentType(studentId, type));
    }
    
    @GetMapping("/student/{studentId}/verified")
    public ResponseEntity<List<StudentDocument>> getVerifiedDocuments(@PathVariable UUID studentId) {
        authz.assertCanViewStudent(studentId);
        return ResponseEntity.ok(studentDocumentRepository.findByStudentIdAndIsVerifiedTrue(studentId));
    }
    
    @GetMapping("/expiring-before")
    public ResponseEntity<List<StudentDocument>> getExpiringDocuments(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(studentDocumentRepository.findByExpiresAtBefore(date));
    }
    
    @GetMapping("/student/{studentId}/count")
    public ResponseEntity<Long> countDocumentsByStudent(@PathVariable UUID studentId) {
        authz.assertCanViewStudent(studentId);
        return ResponseEntity.ok(studentDocumentRepository.countByStudentId(studentId));
    }
    
    @PostMapping
    public ResponseEntity<StudentDocument> createDocument(@Valid @RequestBody StudentDocument document) {
        return ResponseEntity.ok(studentDocumentRepository.save(document));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<StudentDocument> updateDocument(@PathVariable UUID id, @Valid @RequestBody StudentDocument documentDetails) {
        return studentDocumentRepository.findById(id).map(document -> {
            if (documentDetails.getDocumentType() != null) document.setDocumentType(documentDetails.getDocumentType());
            if (documentDetails.getDocumentName() != null) document.setDocumentName(documentDetails.getDocumentName());
            if (documentDetails.getFileUrl() != null) document.setFileUrl(documentDetails.getFileUrl());
            if (documentDetails.getExpiresAt() != null) document.setExpiresAt(documentDetails.getExpiresAt());
            if (documentDetails.getIsVerified() != null) document.setIsVerified(documentDetails.getIsVerified());
            return ResponseEntity.ok(studentDocumentRepository.save(document));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PatchMapping("/{id}/verify")
    public ResponseEntity<StudentDocument> verifyDocument(@PathVariable UUID id) {
        return studentDocumentRepository.findById(id).map(document -> {
            document.setIsVerified(true);
            return ResponseEntity.ok(studentDocumentRepository.save(document));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable UUID id) {
        if (studentDocumentRepository.existsById(id)) {
            studentDocumentRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
