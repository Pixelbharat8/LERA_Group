package com.lera.payment_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.Positive;

@Entity
@Table(name = "invoice_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceItem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "invoice_id", nullable = false)
    private UUID invoiceId;

    @Column(name = "description")
    private String description;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "unit_price", precision = 10, scale = 2)
    @Positive
    private BigDecimal unitPrice;

    @Column(name = "amount", precision = 10, scale = 2)
    @Positive
    private BigDecimal amount;

    /**
     * total_price is NOT NULL in the table but had no field on this entity, so an insert through
     * it could never have succeeded — which is part of why nothing ever wrote an invoice item.
     * It is the same figure as {@link #amount} (quantity x unitPrice); amount is kept in step for
     * anything already reading it.
     */
    @Column(name = "total_price", precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "item_type")
    private String itemType;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        reprice();
    }

    @PreUpdate
    protected void onUpdate() {
        reprice();
    }

    /**
     * The line total is quantity x unit price. A caller may state it, but it is recomputed here so
     * a stated figure cannot disagree with the parts it is made of — the same stance
     * InvoiceServiceImpl takes on the invoice total.
     */
    public void reprice() {
        if (quantity != null && unitPrice != null) {
            BigDecimal computed = unitPrice.multiply(BigDecimal.valueOf(quantity));
            amount = computed;
            totalPrice = computed;
        } else if (totalPrice == null && amount != null) {
            totalPrice = amount;
        } else if (amount == null && totalPrice != null) {
            amount = totalPrice;
        }
    }
}
