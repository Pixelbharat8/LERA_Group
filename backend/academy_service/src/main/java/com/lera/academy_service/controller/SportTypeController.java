package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.SportType;
import com.lera.academy_service.repository.SportTypeRepository;
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
@RequestMapping("/api/sport-types")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class SportTypeController {

    private final SportTypeRepository sportTypeRepository;

    @GetMapping
    public ResponseEntity<List<SportType>> getAll(Pageable pageable) {
        return ResponseEntity.ok(sportTypeRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SportType> getById(@PathVariable UUID id) {
        return sportTypeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<SportType> create(@Valid @RequestBody SportType sportType) {
        return ResponseEntity.ok(sportTypeRepository.save(sportType));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SportType> update(@PathVariable UUID id, @Valid @RequestBody SportType sportType) {
        return sportTypeRepository.findById(id)
                .map(existing -> {
                    sportType.setId(id);
                    return ResponseEntity.ok(sportTypeRepository.save(sportType));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (sportTypeRepository.existsById(id)) {
            sportTypeRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
