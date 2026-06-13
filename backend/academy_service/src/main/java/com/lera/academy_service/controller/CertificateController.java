package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.entity.Certificate;
import com.lera.academy_service.repository.CertificateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class CertificateController {
    
    private final CertificateRepository certificateRepository;
    private final AcademyAuthorizationService authz;

    @GetMapping
    public ResponseEntity<List<Certificate>> getAllCertificates(Pageable pageable) {
        return ResponseEntity.ok(certificateRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Certificate> getCertificateById(@PathVariable UUID id) {
        return certificateRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Certificate>> getCertificatesByStudent(@PathVariable UUID studentId) {
        authz.assertCanViewStudent(studentId);
        return ResponseEntity.ok(certificateRepository.findByStudentId(studentId));
    }
    
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Certificate>> getCertificatesByCourse(@PathVariable UUID courseId) {
        return ResponseEntity.ok(certificateRepository.findByCourseId(courseId));
    }
    
    @GetMapping("/number/{certificateNumber}")
    public ResponseEntity<Certificate> getCertificateByNumber(@PathVariable String certificateNumber) {
        return certificateRepository.findByCertificateNumber(certificateNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/verify/{verificationCode}")
    public ResponseEntity<Map<String, Object>> verifyCertificate(@PathVariable String verificationCode) {
        return certificateRepository.findByVerificationCode(verificationCode)
                .map(cert -> {
                    if (cert.getIsRevoked()) {
                        return ResponseEntity.ok(Map.<String, Object>of(
                            "valid", false,
                            "message", "Certificate has been revoked",
                            "revokedAt", cert.getRevokedAt() != null ? cert.getRevokedAt().toString() : "",
                            "reason", cert.getRevokedReason() != null ? cert.getRevokedReason() : ""
                        ));
                    }
                    return ResponseEntity.ok(Map.<String, Object>of(
                        "valid", true,
                        "studentName", cert.getStudentName(),
                        "courseName", cert.getCourseName(),
                        "issueDate", cert.getIssueDate().toString(),
                        "certificateNumber", cert.getCertificateNumber(),
                        "grade", cert.getGrade() != null ? cert.getGrade() : ""
                    ));
                })
                .orElse(ResponseEntity.ok(Map.of("valid", false, "message", "Certificate not found")));
    }
    
    @PostMapping
    public ResponseEntity<Certificate> createCertificate(@Valid @RequestBody Certificate certificate) {
        return ResponseEntity.ok(certificateRepository.save(certificate));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Certificate> updateCertificate(@PathVariable UUID id, @Valid @RequestBody Certificate certDetails) {
        return certificateRepository.findById(id).map(cert -> {
            if (certDetails.getStudentName() != null) cert.setStudentName(certDetails.getStudentName());
            if (certDetails.getCourseName() != null) cert.setCourseName(certDetails.getCourseName());
            if (certDetails.getGrade() != null) cert.setGrade(certDetails.getGrade());
            if (certDetails.getScore() != null) cert.setScore(certDetails.getScore());
            if (certDetails.getRemarks() != null) cert.setRemarks(certDetails.getRemarks());
            if (certDetails.getExpiryDate() != null) cert.setExpiryDate(certDetails.getExpiryDate());
            return ResponseEntity.ok(certificateRepository.save(cert));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PatchMapping("/{id}/revoke")
    public ResponseEntity<Certificate> revokeCertificate(@PathVariable UUID id, @Valid @RequestBody Map<String, String> body) {
        return certificateRepository.findById(id).map(cert -> {
            cert.setIsRevoked(true);
            cert.setRevokedAt(LocalDateTime.now());
            cert.setRevokedReason(body.get("reason"));
            return ResponseEntity.ok(certificateRepository.save(cert));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCertificate(@PathVariable UUID id) {
        if (certificateRepository.existsById(id)) {
            certificateRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
