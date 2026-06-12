package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.EquipmentAssignment;
import com.lera.academy_service.repository.EquipmentAssignmentRepository;
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
@RequestMapping("/api/equipment-assignments")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class EquipmentAssignmentController {

    private final EquipmentAssignmentRepository equipmentAssignmentRepository;

    @GetMapping
    public ResponseEntity<List<EquipmentAssignment>> getAll(Pageable pageable) {
        return ResponseEntity.ok(equipmentAssignmentRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipmentAssignment> getById(@PathVariable UUID id) {
        return equipmentAssignmentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<EquipmentAssignment> create(@Valid @RequestBody EquipmentAssignment equipmentAssignment) {
        return ResponseEntity.ok(equipmentAssignmentRepository.save(equipmentAssignment));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EquipmentAssignment> update(@PathVariable UUID id, @Valid @RequestBody EquipmentAssignment equipmentAssignment) {
        return equipmentAssignmentRepository.findById(id)
                .map(existing -> {
                    equipmentAssignment.setId(id);
                    return ResponseEntity.ok(equipmentAssignmentRepository.save(equipmentAssignment));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (equipmentAssignmentRepository.existsById(id)) {
            equipmentAssignmentRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
