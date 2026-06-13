package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.MatchEvent;
import com.lera.academy_service.repository.MatchEventRepository;
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
@RequestMapping("/api/match-events")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class MatchEventController {

    private final MatchEventRepository matchEventRepository;

    @GetMapping
    public ResponseEntity<List<MatchEvent>> getAll(Pageable pageable) {
        return ResponseEntity.ok(matchEventRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MatchEvent> getById(@PathVariable UUID id) {
        return matchEventRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<MatchEvent> create(@Valid @RequestBody MatchEvent matchEvent) {
        return ResponseEntity.ok(matchEventRepository.save(matchEvent));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MatchEvent> update(@PathVariable UUID id, @Valid @RequestBody MatchEvent matchEvent) {
        return matchEventRepository.findById(id)
                .map(existing -> {
                    matchEvent.setId(id);
                    return ResponseEntity.ok(matchEventRepository.save(matchEvent));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (matchEventRepository.existsById(id)) {
            matchEventRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
