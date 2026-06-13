package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.PlayerStatistic;
import com.lera.academy_service.repository.PlayerStatisticRepository;
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
@RequestMapping("/api/player-statistics")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class PlayerStatisticController {

    private final PlayerStatisticRepository playerStatisticRepository;

    @GetMapping
    public ResponseEntity<List<PlayerStatistic>> getAll(Pageable pageable) {
        return ResponseEntity.ok(playerStatisticRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlayerStatistic> getById(@PathVariable UUID id) {
        return playerStatisticRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PlayerStatistic> create(@Valid @RequestBody PlayerStatistic playerStatistic) {
        return ResponseEntity.ok(playerStatisticRepository.save(playerStatistic));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlayerStatistic> update(@PathVariable UUID id, @Valid @RequestBody PlayerStatistic playerStatistic) {
        return playerStatisticRepository.findById(id)
                .map(existing -> {
                    playerStatistic.setId(id);
                    return ResponseEntity.ok(playerStatisticRepository.save(playerStatistic));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (playerStatisticRepository.existsById(id)) {
            playerStatisticRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
