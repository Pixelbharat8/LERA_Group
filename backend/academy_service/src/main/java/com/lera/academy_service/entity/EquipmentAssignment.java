package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "equipment_assignments", indexes = {
    @Index(name = "idx_equipment_assignments_equipment", columnList = "equipment_id"),
    @Index(name = "idx_equipment_assignments_student", columnList = "assigned_to")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipmentAssignment {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "equipment_id", nullable = false)
    private UUID equipmentId;

    @Column(name = "assigned_to", nullable = false)
    private UUID assignedTo; // Student/Player ID

    @Column(name = "assigned_by")
    private UUID assignedBy;

    @Column(name = "quantity")
    @Builder.Default
    private Integer quantity = 1;

    @Column(name = "assignment_date", nullable = false)
    @Builder.Default
    private LocalDate assignmentDate = LocalDate.now();

    @Column(name = "expected_return_date")
    private LocalDate expectedReturnDate;

    @Column(name = "actual_return_date")
    private LocalDate actualReturnDate;

    @Column(length = 50)
    @Builder.Default
    private String status = "ISSUED"; // ISSUED, RETURNED, OVERDUE, LOST, DAMAGED

    @Column(name = "condition_at_issue", length = 50)
    private String conditionAtIssue;

    @Column(name = "condition_at_return", length = 50)
    private String conditionAtReturn;

    @Column(name = "damage_charges", precision = 10, scale = 2)
    @Builder.Default
    private java.math.BigDecimal damageCharges = java.math.BigDecimal.ZERO;

    @Column(name = "late_fee", precision = 10, scale = 2)
    @Builder.Default
    private java.math.BigDecimal lateFee = java.math.BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String notes;

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
