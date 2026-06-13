package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "match_events", indexes = {
    @Index(name = "idx_match_events_match", columnList = "match_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchEvent {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "match_id", nullable = false)
    private UUID matchId;

    @Column(name = "team_id")
    private UUID teamId;

    @Column(name = "player_id")
    private UUID playerId;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType; // GOAL, YELLOW_CARD, RED_CARD, SUBSTITUTION, INJURY, PENALTY

    @Column(name = "event_minute")
    private Integer eventMinute;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "assisted_by")
    private UUID assistedBy; // For goals

    @Column(name = "substituted_player_id")
    private UUID substitutedPlayerId; // For substitutions

    @Column(name = "video_clip_url", columnDefinition = "TEXT")
    private String videoClipUrl;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
