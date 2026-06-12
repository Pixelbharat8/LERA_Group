package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.SportEquipment;
import com.lera.academy_service.repository.SportEquipmentRepository;
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
@RequestMapping("/api/sport-equipment")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class SportEquipmentController {

    private final SportEquipmentRepository sportEquipmentRepository;

    @GetMapping
    public ResponseEntity<List<SportEquipment>> getAll(Pageable pageable) {
        return ResponseEntity.ok(sportEquipmentRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SportEquipment> getById(@PathVariable UUID id) {
        return sportEquipmentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<SportEquipment> create(@Valid @RequestBody SportEquipment sportEquipment) {
        return ResponseEntity.ok(sportEquipmentRepository.save(sportEquipment));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SportEquipment> update(@PathVariable UUID id, @Valid @RequestBody SportEquipment sportEquipment) {
        return sportEquipmentRepository.findById(id)
                .map(existing -> {
                    sportEquipment.setId(id);
                    return ResponseEntity.ok(sportEquipmentRepository.save(sportEquipment));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (sportEquipmentRepository.existsById(id)) {
            sportEquipmentRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
