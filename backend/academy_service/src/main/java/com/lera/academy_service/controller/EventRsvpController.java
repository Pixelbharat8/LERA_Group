package com.lera.academy_service.controller;

import com.lera.academy_service.entity.EventRsvp;
import com.lera.academy_service.repository.EventRsvpRepository;
import com.lera.academy_service.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * RSVPs to calendar events. Any authenticated user can RSVP for themselves and read their own
 * RSVPs; staff may read all RSVPs for a given event (headcount).
 */
@RestController
@RequestMapping("/api/event-rsvps")
@PreAuthorize("isAuthenticated()")
public class EventRsvpController {

    private final EventRsvpRepository repo;

    public EventRsvpController(EventRsvpRepository repo) {
        this.repo = repo;
    }

    /** My RSVPs, or (staff only) all RSVPs for one event. */
    @GetMapping
    public ResponseEntity<List<EventRsvp>> list(@RequestParam(required = false) UUID eventId) {
        UUID me = CurrentUser.id().orElse(null);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (eventId != null && CurrentUser.isStaff()) {
            return ResponseEntity.ok(repo.findByEventId(eventId));
        }
        return ResponseEntity.ok(repo.findByUserId(me));
    }

    /** Upsert my RSVP for an event (one row per event+user). */
    @PostMapping
    public ResponseEntity<EventRsvp> rsvp(@RequestBody EventRsvp body) {
        UUID me = CurrentUser.id().orElse(null);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (body.getEventId() == null) return ResponseEntity.badRequest().build();
        EventRsvp row = repo.findByEventIdAndUserId(body.getEventId(), me).orElseGet(EventRsvp::new);
        row.setEventId(body.getEventId());
        row.setUserId(me);
        row.setStudentId(body.getStudentId());
        String r = body.getResponse();
        row.setResponse(r == null || r.isBlank() ? "GOING" : r.toUpperCase());
        return ResponseEntity.ok(repo.save(row));
    }
}
