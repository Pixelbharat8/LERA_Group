package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.SportTeam;
import com.lera.academy_service.repository.SportTeamRepository;
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
@RequestMapping("/api/sport-teams")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class SportTeamController {

    private final SportTeamRepository sportTeamRepository;

    @GetMapping
    public ResponseEntity<List<SportTeam>> getAll(Pageable pageable) {
        return ResponseEntity.ok(sportTeamRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SportTeam> getById(@PathVariable UUID id) {
        return sportTeamRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<SportTeam> create(@Valid @RequestBody SportTeam sportTeam) {
        return ResponseEntity.ok(sportTeamRepository.save(sportTeam));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SportTeam> update(@PathVariable UUID id, @Valid @RequestBody SportTeam sportTeam) {
        return sportTeamRepository.findById(id)
                .map(existing -> {
                    sportTeam.setId(id);
                    return ResponseEntity.ok(sportTeamRepository.save(sportTeam));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (sportTeamRepository.existsById(id)) {
            sportTeamRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
