package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** A bookstore order. Line items are stored as a JSON string in {@code items_json}. DB-backed. */
@Entity
@Table(name = "bookstore_orders", indexes = {
        @Index(name = "idx_bko_status", columnList = "status")
})
@Data
public class BookstoreOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "order_number")
    private String orderNumber;

    @Column(name = "customer_id")
    private UUID customerId;

    @Column(name = "customer_name")
    private String customerName;

    /** JSON array of {productId, name, price, quantity}. */
    @Column(name = "items_json", columnDefinition = "TEXT")
    private String itemsJson;

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    /** PENDING | PAID | FULFILLED | CANCELLED */
    @Column(name = "status")
    private String status = "PENDING";

    @Column(name = "center_id")
    private UUID centerId;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = "PENDING";
        if (orderNumber == null) orderNumber = "ORD-" + System.currentTimeMillis();
    }
}
