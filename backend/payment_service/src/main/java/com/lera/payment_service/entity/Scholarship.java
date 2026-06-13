package com.lera.payment_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "scholarships")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Scholarship {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "scholarship_name", nullable = false)
    private String scholarshipName;

    @Column(name = "scholarship_code", unique = true, length = 50)
    private String scholarshipCode;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "scholarship_type", length = 50)
    private String scholarshipType; // MERIT, NEED_BASED, SIBLING, REFERRAL, FULL, PARTIAL

    @Column(name = "discount_type", length = 50)
    @Builder.Default
    private String discountType = "PERCENTAGE"; // PERCENTAGE, FIXED_AMOUNT

    @Column(name = "discount_value", precision = 12, scale = 2)
    @PositiveOrZero
    private BigDecimal discountValue;

    @Column(name = "max_discount_amount", precision = 12, scale = 2)
    @PositiveOrZero
    private BigDecimal maxDiscountAmount;

    @Column(name = "eligibility_criteria", columnDefinition = "TEXT")
    private String eligibilityCriteria; // JSON

    @Column(name = "required_documents", columnDefinition = "TEXT")
    private String requiredDocuments; // JSON

    @Column(name = "max_recipients")
    private Integer maxRecipients;

    @Column(name = "current_recipients")
    @Builder.Default
    private Integer currentRecipients = 0;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "application_deadline")
    private LocalDate applicationDeadline;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_renewable")
    @Builder.Default
    private Boolean isRenewable = false;

    @Column(name = "renewal_criteria", columnDefinition = "TEXT")
    private String renewalCriteria; // JSON

    @Column(name = "sponsor_name", length = 200)
    private String sponsorName;

    @Column(name = "total_budget", precision = 15, scale = 2)
    @PositiveOrZero
    private BigDecimal totalBudget;

    @Column(name = "spent_budget", precision = 15, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal spentBudget = BigDecimal.ZERO;

    @Column(name = "auto_apply")
    @Builder.Default
    private Boolean autoApply = false; // Automatically apply to eligible students

    @Column(name = "created_by")
    private UUID createdBy;

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
