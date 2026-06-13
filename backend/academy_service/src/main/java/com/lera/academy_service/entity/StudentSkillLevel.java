package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "student_skill_levels", indexes = {
    @Index(name = "idx_student_skill_levels_student", columnList = "student_id"),
    @Index(name = "idx_student_skill_levels_source_lead", columnList = "source_lead_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentSkillLevel {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "skill_category", nullable = false, length = 100)
    private String skillCategory; // reading, writing, speaking, listening, grammar, vocabulary

    @Column(name = "skill_name", nullable = false)
    private String skillName;

    @Column(length = 50)
    private String level; // beginner, elementary, intermediate, advanced

    @Column(precision = 5, scale = 2)
    @PositiveOrZero
    @DecimalMax(value = "100", inclusive = true)
    private BigDecimal score; // 0-100

    @Column(name = "assessed_by")
    private UUID assessedBy;

    @Column(name = "assessed_at")
    private LocalDate assessedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    /** Set for CRM lead → Academy placement import; used to upsert one row per (student, lead). */
    @Column(name = "source_lead_id")
    private UUID sourceLeadId;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
