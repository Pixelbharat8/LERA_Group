package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tournaments", indexes = {
    @Index(name = "idx_tournaments_sport", columnList = "sport_type_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tournament {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tournament_name", nullable = false)
    private String tournamentName;

    @Column(name = "tournament_code", unique = true, length = 50)
    private String tournamentCode;

    @Column(name = "sport_type_id", nullable = false)
    private UUID sportTypeId;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "tournament_type", length = 50)
    private String tournamentType; // KNOCKOUT, LEAGUE, ROUND_ROBIN, MIXED

    @Column(name = "age_group", length = 50)
    private String ageGroup;

    @Column(name = "gender", length = 20)
    private String gender;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "registration_deadline")
    private LocalDate registrationDeadline;

    @Column(name = "max_teams")
    private Integer maxTeams;

    @Column(name = "registered_teams")
    @Builder.Default
    private Integer registeredTeams = 0;

    @Column(name = "prize_pool", precision = 12, scale = 2)
    private java.math.BigDecimal prizePool;

    @Column(name = "first_prize", precision = 12, scale = 2)
    private java.math.BigDecimal firstPrize;

    @Column(name = "winner_team_id")
    private UUID winnerTeamId;

    @Column(name = "runner_up_team_id")
    private UUID runnerUpTeamId;

    @Column(length = 50)
    @Builder.Default
    private String status = "UPCOMING"; // UPCOMING, REGISTRATION_OPEN, ONGOING, COMPLETED, CANCELLED

    @Column(name = "organizer_id")
    private UUID organizerId;

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    @Column(columnDefinition = "TEXT")
    private String rules;

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
