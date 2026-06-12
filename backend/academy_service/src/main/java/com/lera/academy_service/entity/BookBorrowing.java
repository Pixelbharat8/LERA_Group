package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "book_borrowings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookBorrowing {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "id", columnDefinition = "VARCHAR(36)")
    private UUID id;

    @Column(name = "book_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID bookId;

    @Column(name = "student_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID studentId;

    @Column(name = "borrow_date", nullable = false)
    private LocalDateTime borrowDate;

    @Column(name = "due_date", nullable = false)
    private LocalDateTime dueDate;

    @Column(name = "return_date")
    private LocalDateTime returnDate;

    @Column(name = "status", nullable = false, length = 20)
    private String status; // BORROWED, RETURNED, OVERDUE, LOST

    @Column(name = "condition_when_borrowed", length = 50)
    private String conditionWhenBorrowed;

    @Column(name = "condition_when_returned", length = 50)
    private String conditionWhenReturned;

    @Column(name = "renewal_count")
    @Builder.Default
    private Integer renewalCount = 0;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "issued_by", columnDefinition = "VARCHAR(36)")
    private UUID issuedBy;

    @Column(name = "returned_to", columnDefinition = "VARCHAR(36)")
    private UUID returnedTo;

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
