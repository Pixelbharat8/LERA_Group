package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sport_matches", indexes = {
    @Index(name = "idx_sport_matches_sport", columnList = "sport_type_id"),
    @Index(name = "idx_sport_matches_date", columnList = "match_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportMatch {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "sport_type_id", nullable = false)
    private UUID sportTypeId;

    @Column(name = "match_code", unique = true, length = 50)
    private String matchCode;

    @Column(name = "match_name")
    private String matchName;

    @Column(name = "tournament_id")
    private UUID tournamentId;

    @Column(name = "home_team_id", nullable = false)
    private UUID homeTeamId;

    @Column(name = "away_team_id", nullable = false)
    private UUID awayTeamId;

    @Column(name = "match_date", nullable = false)
    private LocalDate matchDate;

    @Column(name = "match_time")
    private java.time.LocalTime matchTime;

    @Column(length = 200)
    private String venue;

    @Column(name = "match_type", length = 50)
    private String matchType; // LEAGUE, FRIENDLY, TOURNAMENT, PLAYOFF

    @Column(name = "home_team_score")
    private Integer homeTeamScore;

    @Column(name = "away_team_score")
    private Integer awayTeamScore;

    @Column(name = "winner_team_id")
    private UUID winnerTeamId;

    @Column(length = 50)
    @Builder.Default
    private String status = "SCHEDULED"; // SCHEDULED, LIVE, COMPLETED, POSTPONED, CANCELLED

    @Column(name = "referee_id")
    private UUID refereeId;

    @Column(name = "match_duration_minutes")
    private Integer matchDurationMinutes;

    @Column(name = "attendance")
    private Integer attendance;

    @Column(columnDefinition = "TEXT")
    private String highlights; // JSON - key moments

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "video_url", columnDefinition = "TEXT")
    private String videoUrl;

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
