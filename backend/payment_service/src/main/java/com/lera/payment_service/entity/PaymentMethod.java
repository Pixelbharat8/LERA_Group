package com.lera.payment_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment_methods")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentMethod {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "method_name", nullable = false, length = 100)
    private String methodName; // Cash, Bank Transfer, Credit Card, Momo, ZaloPay, etc.

    @Column(name = "method_code", unique = true, length = 50)
    private String methodCode;

    @Column(name = "method_type", length = 50)
    private String methodType; // CASH, BANK_TRANSFER, CARD, E_WALLET, INSTALLMENT

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "provider_name", length = 100)
    private String providerName; // Visa, Mastercard, Momo, ZaloPay, VNPay, etc.

    @Column(name = "account_info", columnDefinition = "TEXT")
    private String accountInfo; // JSON - bank account details, API credentials, etc.

    @Column(name = "transaction_fee_percentage", precision = 5, scale = 2)
    @Builder.Default
    private java.math.BigDecimal transactionFeePercentage = java.math.BigDecimal.ZERO;

    @Column(name = "fixed_transaction_fee", precision = 10, scale = 2)
    @Builder.Default
    private java.math.BigDecimal fixedTransactionFee = java.math.BigDecimal.ZERO;

    @Column(name = "min_amount", precision = 12, scale = 2)
    private java.math.BigDecimal minAmount;

    @Column(name = "max_amount", precision = 12, scale = 2)
    private java.math.BigDecimal maxAmount;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_default")
    @Builder.Default
    private Boolean isDefault = false;

    @Column(name = "is_online")
    @Builder.Default
    private Boolean isOnline = false;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "icon_url", columnDefinition = "TEXT")
    private String iconUrl;

    @Column(name = "requires_verification")
    @Builder.Default
    private Boolean requiresVerification = false;

    @Column(name = "processing_time_hours")
    private Integer processingTimeHours;

    @Column(columnDefinition = "TEXT")
    private String instructions; // Payment instructions for users

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
