package com.lera.payment_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.Positive;

@Entity
@Table(name = "fee_receipts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeeReceipt {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(name = "receipt_number", unique = true)
    private String receiptNumber;
    
    @Column(name = "student_id")
    private UUID studentId;
    
    @Column(name = "payment_id")
    private UUID paymentId;
    
    @Column(name = "invoice_id")
    private UUID invoiceId;
    
    @Column(name = "amount")
    @Positive
    private BigDecimal amount;
    
    @Column(name = "payment_method")
    private String paymentMethod;
    
    @Column(name = "receipt_date")
    private LocalDateTime receiptDate;
    
    @Column(name = "notes")
    private String notes;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "created_by")
    private UUID createdBy;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        receiptDate = LocalDateTime.now();
    }
}
