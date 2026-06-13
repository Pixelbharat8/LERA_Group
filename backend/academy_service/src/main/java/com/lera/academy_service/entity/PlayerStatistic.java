package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "player_statistics", indexes = {
    @Index(name = "idx_player_statistics_player", columnList = "player_id"),
    @Index(name = "idx_player_statistics_match", columnList = "match_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerStatistic {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "player_id", nullable = false)
    private UUID playerId;

    @Column(name = "match_id")
    private UUID matchId;

    @Column(name = "team_id")
    private UUID teamId;

    @Column(name = "season", length = 50)
    private String season; // 2024-2025

    @Column(name = "minutes_played")
    @Builder.Default
    private Integer minutesPlayed = 0;

    @Column(name = "goals_scored")
    @Builder.Default
    private Integer goalsScored = 0;

    @Column(name = "assists")
    @Builder.Default
    private Integer assists = 0;

    @Column(name = "yellow_cards")
    @Builder.Default
    private Integer yellowCards = 0;

    @Column(name = "red_cards")
    @Builder.Default
    private Integer redCards = 0;

    @Column(name = "shots_on_target")
    @Builder.Default
    private Integer shotsOnTarget = 0;

    @Column(name = "shots_off_target")
    @Builder.Default
    private Integer shotsOffTarget = 0;

    @Column(name = "passes_completed")
    @Builder.Default
    private Integer passesCompleted = 0;

    @Column(name = "passes_attempted")
    @Builder.Default
    private Integer passesAttempted = 0;

    @Column(name = "tackles")
    @Builder.Default
    private Integer tackles = 0;

    @Column(name = "interceptions")
    @Builder.Default
    private Integer interceptions = 0;

    @Column(name = "fouls_committed")
    @Builder.Default
    private Integer foulsCommitted = 0;

    @Column(name = "fouls_suffered")
    @Builder.Default
    private Integer foulsSuffered = 0;

    @Column(name = "saves")
    @Builder.Default
    private Integer saves = 0; // For goalkeepers

    @Column(name = "player_rating", precision = 3, scale = 1)
    private java.math.BigDecimal playerRating; // Out of 10

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
