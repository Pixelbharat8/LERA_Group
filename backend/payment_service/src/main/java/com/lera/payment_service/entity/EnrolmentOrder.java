package com.lera.payment_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A public, pre-enrolment payment order — created when a prospective family chooses to pay for a
 * programme online (before a full student account exists). Tracks the VNPay transaction lifecycle;
 * the back office converts a PAID order into a real enrolment + invoice.
 */
@Entity
@Table(name = "enrolment_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnrolmentOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Merchant transaction reference sent to VNPay (vnp_TxnRef) — unique. */
    @Column(name = "txn_ref", unique = true, nullable = false, length = 64)
    private String txnRef;

    @Column(name = "course_code", length = 50)
    private String courseCode;

    @Column(precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "student_name")
    private String studentName;

    @Column(name = "parent_name")
    private String parentName;

    @Column(length = 30)
    private String phone;

    private String email;

    /** PENDING → PAID / FAILED. */
    @Column(length = 20)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "vnp_response_code", length = 10)
    private String vnpResponseCode;

    @Column(name = "vnp_transaction_no", length = 30)
    private String vnpTransactionNo;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = "PENDING";
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
