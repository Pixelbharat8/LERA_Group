package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.Tournament;
import com.lera.academy_service.repository.TournamentRepository;
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
@RequestMapping("/api/tournaments")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class TournamentController {

    private final TournamentRepository tournamentRepository;

    @GetMapping
    public ResponseEntity<List<Tournament>> getAll(Pageable pageable) {
        return ResponseEntity.ok(tournamentRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tournament> getById(@PathVariable UUID id) {
        return tournamentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Tournament> create(@Valid @RequestBody Tournament tournament) {
        return ResponseEntity.ok(tournamentRepository.save(tournament));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tournament> update(@PathVariable UUID id, @Valid @RequestBody Tournament tournament) {
        return tournamentRepository.findById(id)
                .map(existing -> {
                    tournament.setId(id);
                    return ResponseEntity.ok(tournamentRepository.save(tournament));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (tournamentRepository.existsById(id)) {
            tournamentRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
