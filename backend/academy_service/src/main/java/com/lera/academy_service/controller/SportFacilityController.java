package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.SportFacility;
import com.lera.academy_service.repository.SportFacilityRepository;
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
@RequestMapping("/api/sport-facilities")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class SportFacilityController {

    private final SportFacilityRepository sportFacilityRepository;

    @GetMapping
    public ResponseEntity<List<SportFacility>> getAll(Pageable pageable) {
        return ResponseEntity.ok(sportFacilityRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SportFacility> getById(@PathVariable UUID id) {
        return sportFacilityRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<SportFacility> create(@Valid @RequestBody SportFacility sportFacility) {
        return ResponseEntity.ok(sportFacilityRepository.save(sportFacility));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SportFacility> update(@PathVariable UUID id, @Valid @RequestBody SportFacility sportFacility) {
        return sportFacilityRepository.findById(id)
                .map(existing -> {
                    sportFacility.setId(id);
                    return ResponseEntity.ok(sportFacilityRepository.save(sportFacility));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (sportFacilityRepository.existsById(id)) {
            sportFacilityRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
