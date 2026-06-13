package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "library_inventory")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LibraryInventory {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "id", columnDefinition = "VARCHAR(36)")
    private UUID id;

    @Column(name = "book_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID bookId;

    @Column(name = "barcode", unique = true, length = 100)
    private String barcode;

    @Column(name = "condition", nullable = false, length = 50)
    private String condition; // NEW, GOOD, FAIR, POOR, DAMAGED

    @Column(name = "status", nullable = false, length = 20)
    private String status; // AVAILABLE, BORROWED, RESERVED, MAINTENANCE, LOST

    @Column(name = "purchase_date")
    private LocalDateTime purchaseDate;

    @Column(name = "purchase_price")
    private Double purchasePrice;

    @Column(name = "location", length = 100)
    private String location;

    @Column(name = "last_borrowed_date")
    private LocalDateTime lastBorrowedDate;

    @Column(name = "total_borrows")
    @Builder.Default
    private Integer totalBorrows = 0;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
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
