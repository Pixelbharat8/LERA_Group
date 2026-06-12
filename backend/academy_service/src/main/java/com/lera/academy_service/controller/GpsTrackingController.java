package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.GpsTracking;
import com.lera.academy_service.repository.GpsTrackingRepository;
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
@RequestMapping("/api/gps-tracking")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class GpsTrackingController {

    private final GpsTrackingRepository gpsTrackingRepository;

    @GetMapping
    public ResponseEntity<List<GpsTracking>> getAll(Pageable pageable) {
        return ResponseEntity.ok(gpsTrackingRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GpsTracking> getById(@PathVariable UUID id) {
        return gpsTrackingRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<GpsTracking> create(@Valid @RequestBody GpsTracking gpsTracking) {
        return ResponseEntity.ok(gpsTrackingRepository.save(gpsTracking));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GpsTracking> update(@PathVariable UUID id, @Valid @RequestBody GpsTracking gpsTracking) {
        return gpsTrackingRepository.findById(id)
                .map(existing -> {
                    gpsTracking.setId(id);
                    return ResponseEntity.ok(gpsTrackingRepository.save(gpsTracking));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (gpsTrackingRepository.existsById(id)) {
            gpsTrackingRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
