package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.SportTrainingSession;
import com.lera.academy_service.repository.SportTrainingSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/sport-training-sessions")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class SportTrainingSessionController {

    private final SportTrainingSessionRepository sportTrainingSessionRepository;

    @GetMapping
    public ResponseEntity<List<SportTrainingSession>> getAll(Pageable pageable) {
        return ResponseEntity.ok(sportTrainingSessionRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SportTrainingSession> getById(@PathVariable UUID id) {
        return sportTrainingSessionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<SportTrainingSession> create(@Valid @RequestBody SportTrainingSession sportTrainingSession) {
        return ResponseEntity.ok(sportTrainingSessionRepository.save(sportTrainingSession));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SportTrainingSession> update(@PathVariable UUID id, @Valid @RequestBody SportTrainingSession sportTrainingSession) {
        return sportTrainingSessionRepository.findById(id)
                .map(existing -> {
                    sportTrainingSession.setId(id);
                    return ResponseEntity.ok(sportTrainingSessionRepository.save(sportTrainingSession));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (sportTrainingSessionRepository.existsById(id)) {
            sportTrainingSessionRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
