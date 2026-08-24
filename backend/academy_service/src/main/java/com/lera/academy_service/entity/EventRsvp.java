package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A parent/student RSVP to a {@link CalendarEvent}. One row per (event, user) — the controller
 * upserts so changing your answer updates the same row.
 */
@Entity
@Table(name = "event_rsvps", uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "user_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventRsvp {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /** Optional: which child this RSVP is on behalf of. */
    @Column(name = "student_id")
    private UUID studentId;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String response = "GOING"; // GOING, MAYBE, NOT_GOING

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    // @Builder.Default is skipped on the @NoArgsConstructor path (Jackson / new EventRsvp()), and
    // @PreUpdate does not fire on insert — guard both timestamps so a create can't persist null.
    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
