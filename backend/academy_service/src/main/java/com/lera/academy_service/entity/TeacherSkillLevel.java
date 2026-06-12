package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "teacher_skill_levels")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherSkillLevel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "teacher_id", nullable = false)
    private UUID teacherId;

    @Column(name = "skill_category", nullable = false, length = 100)
    private String skillCategory;

    @Column(length = 50)
    private String level;

    private Integer score;

    @Column(name = "assessed_by")
    private UUID assessedBy;

    @Column(name = "assessed_at")
    private LocalDate assessedAt;

    @Column(name = "certification_name")
    private String certificationName;

    @Column(name = "certification_body")
    private String certificationBody;

    @Column(name = "certification_date")
    private LocalDate certificationDate;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
