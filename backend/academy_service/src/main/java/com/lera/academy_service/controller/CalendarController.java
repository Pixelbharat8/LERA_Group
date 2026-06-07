package com.lera.academy_service.controller;

import com.lera.academy_service.entity.CalendarEvent;
import com.lera.academy_service.repository.CalendarEventRepository;
import com.lera.academy_service.security.AcademyRoles;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Calendar events — now DB-backed (was an in-memory stub that lost data on restart).
 * API contract is unchanged so the existing dashboard calendar keeps working.
 */
@RestController
@RequestMapping("/api/calendar")
@PreAuthorize(AcademyRoles.STAFF)
public class CalendarController {

    private final CalendarEventRepository repository;

    public CalendarController(CalendarEventRepository repository) {
        this.repository = repository;
    }

    /** Events whose start date falls within the given month (defaults to the current month). */
    @GetMapping("/events")
    public ResponseEntity<List<CalendarEvent>> getEvents(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) UUID centerId) {

        int targetMonth = month != null ? month : LocalDate.now().getMonthValue();
        int targetYear = year != null ? year : LocalDate.now().getYear();

        LocalDateTime from = LocalDate.of(targetYear, targetMonth, 1).atStartOfDay();
        LocalDateTime to = from.plusMonths(1);

        List<CalendarEvent> events = (centerId != null)
                ? repository.findByStartDateBetweenAndCenterIdOrderByStartDateAsc(from, to, centerId)
                : repository.findByStartDateBetweenOrderByStartDateAsc(from, to);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/events/{eventId}")
    public ResponseEntity<CalendarEvent> getEventById(@PathVariable UUID eventId) {
        return repository.findById(eventId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/events")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER','STAFF','TEACHER')")
    public ResponseEntity<CalendarEvent> createEvent(@Valid @RequestBody CalendarEvent event) {
        event.setId(null);
        return ResponseEntity.ok(repository.save(event));
    }

    @PutMapping("/events/{eventId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER','STAFF','TEACHER')")
    public ResponseEntity<CalendarEvent> updateEvent(@PathVariable UUID eventId,
                                                     @Valid @RequestBody CalendarEvent body) {
        return repository.findById(eventId).map(existing -> {
            existing.setTitle(body.getTitle());
            existing.setDescription(body.getDescription());
            existing.setStartDate(body.getStartDate());
            existing.setEndDate(body.getEndDate());
            existing.setType(body.getType());
            existing.setColor(body.getColor());
            existing.setLocation(body.getLocation());
            existing.setAllDay(body.getAllDay());
            existing.setCenterId(body.getCenterId());
            return ResponseEntity.ok(repository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/events/{eventId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<Void> deleteEvent(@PathVariable UUID eventId) {
        if (!repository.existsById(eventId)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(eventId);
        return ResponseEntity.noContent().build();
    }

    /** Next {limit} events from now, soonest first. */
    @GetMapping("/upcoming")
    public ResponseEntity<List<CalendarEvent>> getUpcomingEvents(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) UUID userId) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        List<CalendarEvent> events = repository.findByStartDateGreaterThanEqualOrderByStartDateAsc(
                LocalDateTime.now(), PageRequest.of(0, safeLimit));
        return ResponseEntity.ok(events);
    }
}
