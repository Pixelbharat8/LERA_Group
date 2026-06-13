package com.lera.payment_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "ledger_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LedgerEntry {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(name = "center_id")
    private UUID centerId;
    
    @Column(name = "transaction_date")
    private LocalDate transactionDate;
    
    @Column(name = "account_code")
    private String accountCode;
    
    @Column(name = "account_name")
    private String accountName;
    
    @Column(name = "description")
    private String description;
    
    @Column(name = "debit_amount")
    @PositiveOrZero
    private BigDecimal debitAmount = BigDecimal.ZERO;
    
    @Column(name = "credit_amount")
    @PositiveOrZero
    private BigDecimal creditAmount = BigDecimal.ZERO;
    
    @Column(name = "balance")
    @PositiveOrZero
    private BigDecimal balance = BigDecimal.ZERO;
    
    @Column(name = "entry_type")
    private String entryType; // PAYMENT, REFUND, ADJUSTMENT, FEE, DISCOUNT
    
    @Column(name = "reference_id")
    private UUID referenceId;
    
    @Column(name = "reference_type")
    private String referenceType; // PAYMENT, INVOICE, REFUND, etc.
    
    @Column(name = "status")
    private String status = "DRAFT"; // DRAFT, POSTED, APPROVED, VOID
    
    @Column(name = "approved_by")
    private UUID approvedBy;
    
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    
    @Column(name = "posted_at")
    private LocalDateTime postedAt;
    
    @Column(name = "created_by")
    private UUID createdBy;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
