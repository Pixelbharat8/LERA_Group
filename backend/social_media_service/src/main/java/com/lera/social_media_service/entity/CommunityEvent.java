package com.lera.social_media_service.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/** A community event (workshops, mock tests…) the feed shows and users register for. DB-backed. */
@Entity
@Table(name = "community_events", indexes = {
        @Index(name = "idx_community_event_center", columnList = "center_id"),
        @Index(name = "idx_community_event_status", columnList = "status")
})
@Data
public class CommunityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "title")
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "event_date")
    private LocalDateTime eventDate;

    @Column(name = "location")
    private String location;

    @Column(name = "organizer_id")
    private UUID organizerId;

    @Column(name = "organizer_name")
    private String organizerName;

    @Column(name = "attendees")
    private Integer attendees = 0;

    @Column(name = "max_attendees")
    private Integer maxAttendees;

    @Column(name = "status")
    private String status = "upcoming";

    @Column(name = "center_id")
    private UUID centerId;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (attendees == null) attendees = 0;
        if (status == null) status = "upcoming";
    }
}
