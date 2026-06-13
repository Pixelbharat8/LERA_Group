package com.lera.academy_service.controller;

import com.lera.academy_service.entity.TrainingRegistration;
import com.lera.academy_service.entity.TrainingSession;
import com.lera.academy_service.repository.TrainingRegistrationRepository;
import com.lera.academy_service.repository.TrainingSessionRepository;
import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.security.AcademyAuthorizationService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Internal staff training: sessions (schedule), self-registration, and attendance. DB-backed.
 */
@RestController
@RequestMapping("/api/training-sessions")
@PreAuthorize(AcademyRoles.STAFF)
public class TrainingSessionController {

    private static final String ADMIN_ROLES =
            "hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')";

    private final TrainingSessionRepository sessions;
    private final TrainingRegistrationRepository registrations;
    private final AcademyAuthorizationService authz;

    public TrainingSessionController(TrainingSessionRepository sessions,
                                     TrainingRegistrationRepository registrations,
                                     AcademyAuthorizationService authz) {
        this.sessions = sessions;
        this.registrations = registrations;
        this.authz = authz;
    }

    // ---- sessions ----

    @GetMapping
    public ResponseEntity<List<TrainingSession>> list(@RequestParam(required = false) String status,
                                                      @RequestParam(required = false) UUID centerId) {
        UUID eff = authz.effectiveListCenterId(centerId);
        boolean hasStatus = status != null && !status.isBlank();
        List<TrainingSession> result;
        if (eff != null) {
            result = hasStatus ? sessions.findByCenterIdAndStatusOrderByScheduledAtDesc(eff, status)
                               : sessions.findByCenterIdOrderByScheduledAtDesc(eff);
        } else {
            result = hasStatus ? sessions.findByStatusOrderByScheduledAtDesc(status)
                               : sessions.findAllByOrderByScheduledAtDesc();
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<TrainingSession>> upcoming(@RequestParam(defaultValue = "20") int limit) {
        int safe = Math.max(1, Math.min(limit, 100));
        return ResponseEntity.ok(sessions.findByScheduledAtGreaterThanEqualAndStatusOrderByScheduledAtAsc(
                LocalDateTime.now(), "SCHEDULED", PageRequest.of(0, safe)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TrainingSession> getById(@PathVariable UUID id) {
        return sessions.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize(ADMIN_ROLES)
    public ResponseEntity<TrainingSession> create(@Valid @RequestBody TrainingSession body) {
        body.setId(null);
        return ResponseEntity.ok(sessions.save(body));
    }

    @PutMapping("/{id}")
    @PreAuthorize(ADMIN_ROLES)
    public ResponseEntity<TrainingSession> update(@PathVariable UUID id, @Valid @RequestBody TrainingSession body) {
        return sessions.findById(id).map(s -> {
            s.setTitle(body.getTitle());
            s.setDescription(body.getDescription());
            s.setCategory(body.getCategory());
            s.setTrainer(body.getTrainer());
            s.setScheduledAt(body.getScheduledAt());
            s.setDurationMinutes(body.getDurationMinutes());
            s.setLocation(body.getLocation());
            s.setCapacity(body.getCapacity());
            s.setCenterId(body.getCenterId());
            if (body.getStatus() != null) s.setStatus(body.getStatus());
            return ResponseEntity.ok(sessions.save(s));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize(ADMIN_ROLES)
    public ResponseEntity<TrainingSession> complete(@PathVariable UUID id) {
        return setStatus(id, "COMPLETED");
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize(ADMIN_ROLES)
    public ResponseEntity<TrainingSession> cancel(@PathVariable UUID id) {
        return setStatus(id, "CANCELLED");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(ADMIN_ROLES)
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!sessions.existsById(id)) return ResponseEntity.notFound().build();
        sessions.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ---- registrations ----

    @PostMapping("/{id}/register")
    public ResponseEntity<TrainingRegistration> register(@PathVariable UUID id,
                                                         @RequestBody(required = false) Map<String, Object> body) {
        TrainingSession session = sessions.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Training session not found"));
        if (body == null || body.get("userId") == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId is required");
        }
        UUID userId;
        try {
            userId = UUID.fromString(body.get("userId").toString());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid userId");
        }
        if (registrations.existsBySessionIdAndUserId(id, userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already registered");
        }
        if (session.getCapacity() != null && registrations.countBySessionId(id) >= session.getCapacity()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Session is full");
        }
        TrainingRegistration reg = new TrainingRegistration();
        reg.setSessionId(id);
        reg.setUserId(userId);
        if (body.get("userName") != null) reg.setUserName(body.get("userName").toString());
        reg.setStatus("REGISTERED");
        return ResponseEntity.ok(registrations.save(reg));
    }

    @GetMapping("/{id}/registrations")
    public ResponseEntity<List<TrainingRegistration>> sessionRegistrations(@PathVariable UUID id) {
        return ResponseEntity.ok(registrations.findBySessionIdOrderByRegisteredAtAsc(id));
    }

    @GetMapping("/registrations/user/{userId}")
    public ResponseEntity<List<TrainingRegistration>> myRegistrations(@PathVariable UUID userId) {
        return ResponseEntity.ok(registrations.findByUserIdOrderByRegisteredAtDesc(userId));
    }

    @PostMapping("/registrations/{regId}/attended")
    @PreAuthorize(ADMIN_ROLES)
    public ResponseEntity<TrainingRegistration> markAttended(@PathVariable UUID regId) {
        return setRegStatus(regId, "ATTENDED");
    }

    @PostMapping("/registrations/{regId}/no-show")
    @PreAuthorize(ADMIN_ROLES)
    public ResponseEntity<TrainingRegistration> markNoShow(@PathVariable UUID regId) {
        return setRegStatus(regId, "NO_SHOW");
    }

    @DeleteMapping("/registrations/{regId}")
    public ResponseEntity<Void> cancelRegistration(@PathVariable UUID regId) {
        if (!registrations.existsById(regId)) return ResponseEntity.notFound().build();
        registrations.deleteById(regId);
        return ResponseEntity.noContent().build();
    }

    // ---- helpers ----

    private ResponseEntity<TrainingSession> setStatus(UUID id, String status) {
        return sessions.findById(id).map(s -> {
            s.setStatus(status);
            return ResponseEntity.ok(sessions.save(s));
        }).orElse(ResponseEntity.notFound().build());
    }

    private ResponseEntity<TrainingRegistration> setRegStatus(UUID regId, String status) {
        return registrations.findById(regId).map(r -> {
            r.setStatus(status);
            return ResponseEntity.ok(registrations.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }
}
