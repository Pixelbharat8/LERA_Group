package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.SportMatch;
import com.lera.academy_service.repository.SportMatchRepository;
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
@RequestMapping("/api/sport-matches")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class SportMatchController {

    private final SportMatchRepository sportMatchRepository;

    @GetMapping
    public ResponseEntity<List<SportMatch>> getAll(Pageable pageable) {
        return ResponseEntity.ok(sportMatchRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SportMatch> getById(@PathVariable UUID id) {
        return sportMatchRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<SportMatch> create(@Valid @RequestBody SportMatch sportMatch) {
        return ResponseEntity.ok(sportMatchRepository.save(sportMatch));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SportMatch> update(@PathVariable UUID id, @Valid @RequestBody SportMatch sportMatch) {
        return sportMatchRepository.findById(id)
                .map(existing -> {
                    sportMatch.setId(id);
                    return ResponseEntity.ok(sportMatchRepository.save(sportMatch));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (sportMatchRepository.existsById(id)) {
            sportMatchRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
