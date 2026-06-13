package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "library_fines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LibraryFine {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "id", columnDefinition = "VARCHAR(36)")
    private UUID id;

    @Column(name = "borrowing_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID borrowingId;

    @Column(name = "student_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID studentId;

    @Column(name = "fine_type", nullable = false, length = 50)
    private String fineType; // OVERDUE, DAMAGE, LOST

    @Column(name = "amount", nullable = false)
    private Double amount;

    @Column(name = "days_overdue")
    private Integer daysOverdue;

    @Column(name = "daily_fine_rate")
    private Double dailyFineRate;

    @Column(name = "fine_date", nullable = false)
    private LocalDateTime fineDate;

    @Column(name = "paid_amount")
    @Builder.Default
    private Double paidAmount = 0.0;

    @Column(name = "payment_date")
    private LocalDateTime paymentDate;

    @Column(name = "status", nullable = false, length = 20)
    private String status; // PENDING, PAID, WAIVED, CANCELLED

    @Column(name = "waived_reason", columnDefinition = "TEXT")
    private String waivedReason;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

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
