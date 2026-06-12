package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.TournamentTeam;
import com.lera.academy_service.repository.TournamentTeamRepository;
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
@RequestMapping("/api/tournament-teams")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class TournamentTeamController {

    private final TournamentTeamRepository tournamentTeamRepository;

    @GetMapping
    public ResponseEntity<List<TournamentTeam>> getAll(Pageable pageable) {
        return ResponseEntity.ok(tournamentTeamRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TournamentTeam> getById(@PathVariable UUID id) {
        return tournamentTeamRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<TournamentTeam> create(@Valid @RequestBody TournamentTeam tournamentTeam) {
        return ResponseEntity.ok(tournamentTeamRepository.save(tournamentTeam));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TournamentTeam> update(@PathVariable UUID id, @Valid @RequestBody TournamentTeam tournamentTeam) {
        return tournamentTeamRepository.findById(id)
                .map(existing -> {
                    tournamentTeam.setId(id);
                    return ResponseEntity.ok(tournamentTeamRepository.save(tournamentTeam));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (tournamentTeamRepository.existsById(id)) {
            tournamentTeamRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
