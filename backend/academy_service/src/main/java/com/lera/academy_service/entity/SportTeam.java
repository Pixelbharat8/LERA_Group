package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sport_teams", indexes = {
    @Index(name = "idx_sport_teams_sport", columnList = "sport_type_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportTeam {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "sport_type_id", nullable = false)
    private UUID sportTypeId;

    @Column(name = "team_name", nullable = false)
    private String teamName;

    @Column(name = "team_code", unique = true, length = 50)
    private String teamCode;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "age_group", length = 50)
    private String ageGroup; // U10, U12, U15, U18, SENIOR

    @Column(name = "gender", length = 20)
    private String gender; // MALE, FEMALE, MIXED

    @Column(name = "coach_id")
    private UUID coachId;

    @Column(name = "captain_id")
    private UUID captainId;

    @Column(name = "team_logo", columnDefinition = "TEXT")
    private String teamLogo;

    @Column(name = "team_color", length = 50)
    private String teamColor;

    @Column(name = "founded_date")
    private LocalDate foundedDate;

    @Column(name = "home_ground", length = 200)
    private String homeGround;

    @Column(name = "total_players")
    @Builder.Default
    private Integer totalPlayers = 0;

    @Column(name = "matches_played")
    @Builder.Default
    private Integer matchesPlayed = 0;

    @Column(name = "matches_won")
    @Builder.Default
    private Integer matchesWon = 0;

    @Column(name = "matches_lost")
    @Builder.Default
    private Integer matchesLost = 0;

    @Column(name = "matches_drawn")
    @Builder.Default
    private Integer matchesDrawn = 0;

    @Column(length = 50)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, DISSOLVED

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
