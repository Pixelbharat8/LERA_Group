package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.VehicleMaintenance;
import com.lera.academy_service.repository.VehicleMaintenanceRepository;
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
@RequestMapping("/api/vehicle-maintenance")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class VehicleMaintenanceController {

    private final VehicleMaintenanceRepository vehicleMaintenanceRepository;

    @GetMapping
    public ResponseEntity<List<VehicleMaintenance>> getAll(Pageable pageable) {
        return ResponseEntity.ok(vehicleMaintenanceRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleMaintenance> getById(@PathVariable UUID id) {
        return vehicleMaintenanceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<VehicleMaintenance> create(@Valid @RequestBody VehicleMaintenance vehicleMaintenance) {
        return ResponseEntity.ok(vehicleMaintenanceRepository.save(vehicleMaintenance));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehicleMaintenance> update(@PathVariable UUID id, @Valid @RequestBody VehicleMaintenance vehicleMaintenance) {
        return vehicleMaintenanceRepository.findById(id)
                .map(existing -> {
                    vehicleMaintenance.setId(id);
                    return ResponseEntity.ok(vehicleMaintenanceRepository.save(vehicleMaintenance));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (vehicleMaintenanceRepository.existsById(id)) {
            vehicleMaintenanceRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
