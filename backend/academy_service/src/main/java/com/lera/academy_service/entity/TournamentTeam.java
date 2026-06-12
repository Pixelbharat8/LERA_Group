package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tournament_teams", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tournament_id", "team_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TournamentTeam {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tournament_id", nullable = false)
    private UUID tournamentId;

    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    @Column(name = "registration_date", nullable = false)
    @Builder.Default
    private LocalDateTime registrationDate = LocalDateTime.now();

    @Column(name = "seed_number")
    private Integer seedNumber;

    @Column(name = "group_name", length = 10)
    private String groupName; // A, B, C, D for group stages

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

    @Column(name = "goals_for")
    @Builder.Default
    private Integer goalsFor = 0;

    @Column(name = "goals_against")
    @Builder.Default
    private Integer goalsAgainst = 0;

    @Column(name = "points")
    @Builder.Default
    private Integer points = 0;

    @Column(name = "position")
    private Integer position;

    @Column(length = 50)
    @Builder.Default
    private String status = "REGISTERED"; // REGISTERED, CONFIRMED, ELIMINATED, QUALIFIED, WITHDREW

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
