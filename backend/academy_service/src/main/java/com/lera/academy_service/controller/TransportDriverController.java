package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.TransportDriver;
import com.lera.academy_service.repository.TransportDriverRepository;
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
@RequestMapping("/api/transport-drivers")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class TransportDriverController {

    private final TransportDriverRepository transportDriverRepository;

    @GetMapping
    public ResponseEntity<List<TransportDriver>> getAll(Pageable pageable) {
        return ResponseEntity.ok(transportDriverRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransportDriver> getById(@PathVariable UUID id) {
        return transportDriverRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<TransportDriver> create(@Valid @RequestBody TransportDriver transportDriver) {
        return ResponseEntity.ok(transportDriverRepository.save(transportDriver));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransportDriver> update(@PathVariable UUID id, @Valid @RequestBody TransportDriver transportDriver) {
        return transportDriverRepository.findById(id)
                .map(existing -> {
                    transportDriver.setId(id);
                    return ResponseEntity.ok(transportDriverRepository.save(transportDriver));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (transportDriverRepository.existsById(id)) {
            transportDriverRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
