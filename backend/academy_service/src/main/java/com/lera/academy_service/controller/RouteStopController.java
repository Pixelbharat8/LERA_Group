package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.RouteStop;
import com.lera.academy_service.repository.RouteStopRepository;
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
@RequestMapping("/api/route-stops")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class RouteStopController {

    private final RouteStopRepository routeStopRepository;

    @GetMapping
    public ResponseEntity<List<RouteStop>> getAll(Pageable pageable) {
        return ResponseEntity.ok(routeStopRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RouteStop> getById(@PathVariable UUID id) {
        return routeStopRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<RouteStop> create(@Valid @RequestBody RouteStop routeStop) {
        return ResponseEntity.ok(routeStopRepository.save(routeStop));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RouteStop> update(@PathVariable UUID id, @Valid @RequestBody RouteStop routeStop) {
        return routeStopRepository.findById(id)
                .map(existing -> {
                    routeStop.setId(id);
                    return ResponseEntity.ok(routeStopRepository.save(routeStop));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (routeStopRepository.existsById(id)) {
            routeStopRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
