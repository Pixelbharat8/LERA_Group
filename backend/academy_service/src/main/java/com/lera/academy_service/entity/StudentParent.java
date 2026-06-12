package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "student_parents", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "parent_id"}),
       indexes = {
           @Index(name = "idx_student_parents_student", columnList = "student_id"),
           @Index(name = "idx_student_parents_parent", columnList = "parent_id")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentParent {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "parent_id", nullable = false)
    private UUID parentId;

    @Column(nullable = false, length = 50)
    private String relationship; // Father, Mother, Guardian, etc.

    @Column(name = "is_primary")
    @Builder.Default
    private Boolean isPrimary = false;

    @Column(name = "is_emergency_contact")
    @Builder.Default
    private Boolean isEmergencyContact = true;

    @Column(name = "can_pickup")
    @Builder.Default
    private Boolean canPickup = true;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
