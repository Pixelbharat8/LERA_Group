package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * An award a student can earn. The table has been populated all along — First Day, Perfect
 * Attendance, Homework Hero, Level Up, Star Student — and students earn them (StudentPoints
 * carries a badges_earned count), but nothing ever served them: there was no entity, no
 * repository and no endpoint.
 *
 * So the Super Admin gamification screen showed a hardcoded catalogue of five DIFFERENT badges
 * that do not exist (Beginner, Reader, Writer, Achiever, Streak), and its "total badges" tile
 * counted that invented list.
 */
@Entity
@Table(name = "badges")
@Data
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "code")
    private String code;

    @Column(name = "name")
    private String name;

    @Column(name = "name_vi")
    private String nameVi;

    @Column(name = "description")
    private String description;

    @Column(name = "description_vi")
    private String descriptionVi;

    @Column(name = "icon_url")
    private String iconUrl;

    @Column(name = "points_required")
    private Integer pointsRequired;

    @Column(name = "category")
    private String category;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
