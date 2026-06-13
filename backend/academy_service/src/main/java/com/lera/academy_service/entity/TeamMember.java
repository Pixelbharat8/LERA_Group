package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "team_members", indexes = {
    @Index(name = "idx_team_members_team", columnList = "team_id"),
    @Index(name = "idx_team_members_student", columnList = "student_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamMember {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "jersey_number")
    private Integer jerseyNumber;

    @Column(name = "position", length = 50)
    private String position; // FORWARD, DEFENDER, GOALKEEPER, etc.

    @Column(name = "join_date", nullable = false)
    @Builder.Default
    private LocalDate joinDate = LocalDate.now();

    @Column(name = "leave_date")
    private LocalDate leaveDate;

    @Column(name = "is_captain")
    @Builder.Default
    private Boolean isCaptain = false;

    @Column(name = "is_vice_captain")
    @Builder.Default
    private Boolean isViceCaptain = false;

    @Column(length = 50)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, BENCHED, INJURED, SUSPENDED, LEFT

    @Column(name = "matches_played")
    @Builder.Default
    private Integer matchesPlayed = 0;

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
