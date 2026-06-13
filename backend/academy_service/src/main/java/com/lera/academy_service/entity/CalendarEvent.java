package com.lera.academy_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A calendar event (class, exam, meeting, holiday, deadline, …). Persisted so events
 * created in the dashboard survive restarts — replaces the previous in-memory stub.
 */
@Entity
@Table(name = "calendar_events", indexes = {
        @Index(name = "idx_calendar_events_start_date", columnList = "start_date"),
        @Index(name = "idx_calendar_events_center", columnList = "center_id")
})
@Data
public class CalendarEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull
    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    /** class | exam | event | holiday | meeting | deadline */
    @Column(name = "type")
    private String type = "event";

    /** Tailwind background class the UI applies directly, e.g. "bg-blue-500". */
    @Column(name = "color")
    private String color = "bg-blue-500";

    @Column(name = "location")
    private String location;

    @Column(name = "all_day")
    private Boolean allDay = false;

    @Column(name = "center_id")
    private UUID centerId;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
