package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "certificates")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Certificate {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "certificate_number", nullable = false, unique = true)
    private String certificateNumber;
    
    @Column(name = "student_id")
    private UUID studentId;
    
    @Column(name = "student_name", nullable = false)
    private String studentName;
    
    @Column(name = "course_id")
    private UUID courseId;
    
    @Column(name = "course_name", nullable = false)
    private String courseName;
    
    @Column(name = "template_id")
    private UUID templateId;
    
    @Column(name = "certificate_type")
    private String certificateType;
    
    @Column(name = "issue_date")
    private LocalDate issueDate;
    
    @Column(name = "expiry_date")
    private LocalDate expiryDate;
    
    private String grade;
    private Double score;
    
    @Column(name = "certificate_data", columnDefinition = "jsonb")
    private String certificateData;
    
    @Column(name = "file_url", columnDefinition = "TEXT")
    private String fileUrl;
    
    @Column(name = "certificate_url", columnDefinition = "TEXT")
    private String certificateUrl;
    
    @Column(name = "qr_code", columnDefinition = "TEXT")
    private String qrCode;
    
    @Column(name = "qr_code_url", columnDefinition = "TEXT")
    private String qrCodeUrl;
    
    @Column(name = "verification_code")
    private String verificationCode;
    
    @Column(name = "is_verified")
    private Boolean isVerified;
    
    @Column(name = "is_revoked")
    private Boolean isRevoked;
    
    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;
    
    @Column(name = "revoked_reason", columnDefinition = "TEXT")
    private String revokedReason;
    
    @Column(columnDefinition = "TEXT")
    private String remarks;
    
    @Column(name = "issued_by")
    private UUID issuedBy;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (issueDate == null) issueDate = LocalDate.now();
        if (isVerified == null) isVerified = true;
        if (isRevoked == null) isRevoked = false;
        if (certificateNumber == null) certificateNumber = "CERT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        if (verificationCode == null) verificationCode = UUID.randomUUID().toString().substring(0, 12).toUpperCase();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
