package com.lera.payment_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "student_scholarships", indexes = {
    @Index(name = "idx_student_scholarships_student", columnList = "student_id"),
    @Index(name = "idx_student_scholarships_scholarship", columnList = "scholarship_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentScholarship {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "scholarship_id", nullable = false)
    private UUID scholarshipId;

    @Column(name = "application_date", nullable = false)
    @Builder.Default
    private LocalDate applicationDate = LocalDate.now();

    @Column(name = "approval_date")
    private LocalDate approvalDate;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(length = 50)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, ACTIVE, EXPIRED, REVOKED

    @Column(name = "discount_amount", precision = 12, scale = 2)
    @PositiveOrZero
    private BigDecimal discountAmount;

    @Column(name = "total_savings", precision = 12, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal totalSavings = BigDecimal.ZERO;

    @Column(name = "application_documents", columnDefinition = "TEXT")
    private String applicationDocuments; // JSON - array of document URLs

    @Column(name = "verification_status", length = 50)
    private String verificationStatus; // PENDING, VERIFIED, FAILED

    @Column(name = "verified_by")
    private UUID verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "renewal_count")
    @Builder.Default
    private Integer renewalCount = 0;

    @Column(name = "last_renewal_date")
    private LocalDate lastRenewalDate;

    @Column(name = "performance_score", precision = 5, scale = 2)
    @PositiveOrZero
    @DecimalMax(value = "100", inclusive = true)
    private BigDecimal performanceScore; // For merit-based renewals

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
