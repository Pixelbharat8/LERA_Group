package com.lera.payment_service.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.Positive;

@Entity
@Table(name = "student_fee_plans")
public class StudentFeePlan {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "plan_name")
    private String planName;

    @Column(name = "total_amount", precision = 15, scale = 2)
    @Positive
    private BigDecimal totalAmount;

    @Column(name = "installments")
    @jakarta.validation.constraints.Positive
    private Integer installments;

    @Column(name = "installment_amount", precision = 10, scale = 2)
    @Positive
    private BigDecimal installmentAmount;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "status")
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /*
     * The columns below exist on student_fee_plans but were never mapped here, and four of them
     * are NOT NULL — center_id, plan_type, base_amount, final_amount. An insert through this
     * entity therefore could not succeed at all:
     *
     *   ERROR: null value in column "center_id" of relation "student_fee_plans"
     *          violates not-null constraint
     *
     * The finance page has been posting planType, baseAmount, billingDay, courseId, autoRenew,
     * autoInvoice and notes all along; every one of them was dropped because there was nothing
     * here to bind to, and then the insert failed on the NOT NULL columns. Creating a payment
     * plan for a student was impossible.
     */

    @Column(name = "center_id", nullable = false)
    private UUID centerId;

    @Column(name = "center_name")
    private String centerName;

    @Column(name = "student_name")
    private String studentName;

    @Column(name = "course_id")
    private UUID courseId;

    @Column(name = "course_name")
    private String courseName;

    @Column(name = "plan_type", nullable = false)
    private String planType;

    @Column(name = "base_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal baseAmount;

    @Column(name = "discount_amount", precision = 15, scale = 2)
    private BigDecimal discountAmount;

    /** base - discount. NOT NULL, and derived rather than trusted — see StudentFeePlanService. */
    @Column(name = "final_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal finalAmount;

    @Column(name = "billing_day")
    private Integer billingDay;

    @Column(name = "next_billing_date")
    private LocalDate nextBillingDate;

    @Column(name = "auto_renew")
    private Boolean autoRenew;

    @Column(name = "auto_invoice")
    private Boolean autoInvoice;

    @Column(name = "notes")
    private String notes;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = "ACTIVE";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }

    public String getPlanName() { return planName; }
    public void setPlanName(String planName) { this.planName = planName; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public Integer getInstallments() { return installments; }
    public void setInstallments(Integer installments) { this.installments = installments; }

    public BigDecimal getInstallmentAmount() { return installmentAmount; }
    public void setInstallmentAmount(BigDecimal installmentAmount) { this.installmentAmount = installmentAmount; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public UUID getCenterId() { return centerId; }
    public void setCenterId(UUID centerId) { this.centerId = centerId; }

    public String getCenterName() { return centerName; }
    public void setCenterName(String centerName) { this.centerName = centerName; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public UUID getCourseId() { return courseId; }
    public void setCourseId(UUID courseId) { this.courseId = courseId; }

    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }

    public String getPlanType() { return planType; }
    public void setPlanType(String planType) { this.planType = planType; }

    public BigDecimal getBaseAmount() { return baseAmount; }
    public void setBaseAmount(BigDecimal baseAmount) { this.baseAmount = baseAmount; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public BigDecimal getFinalAmount() { return finalAmount; }
    public void setFinalAmount(BigDecimal finalAmount) { this.finalAmount = finalAmount; }

    public Integer getBillingDay() { return billingDay; }
    public void setBillingDay(Integer billingDay) { this.billingDay = billingDay; }

    public LocalDate getNextBillingDate() { return nextBillingDate; }
    public void setNextBillingDate(LocalDate nextBillingDate) { this.nextBillingDate = nextBillingDate; }

    public Boolean getAutoRenew() { return autoRenew; }
    public void setAutoRenew(Boolean autoRenew) { this.autoRenew = autoRenew; }

    public Boolean getAutoInvoice() { return autoInvoice; }
    public void setAutoInvoice(Boolean autoInvoice) { this.autoInvoice = autoInvoice; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}