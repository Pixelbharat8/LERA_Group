package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.TransportRoute;
import com.lera.academy_service.repository.TransportRouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/transport-routes")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class TransportRouteController {
    
    private final TransportRouteRepository transportRouteRepository;
    private final AcademyAuthorizationService authz;

    @GetMapping
    public ResponseEntity<List<TransportRoute>> getAllRoutes(Pageable pageable) {
        authz.assertStaff();
        if (!authz.isOrgWide()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Org-wide role required for unfiltered transport route list");
        }
        return ResponseEntity.ok(transportRouteRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<TransportRoute> getRouteById(@PathVariable String id) {
        return transportRouteRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/code/{code}")
    public ResponseEntity<TransportRoute> getRouteByCode(@PathVariable String code) {
        return transportRouteRepository.findByRouteCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<TransportRoute>> getActiveRoutes() {
        return ResponseEntity.ok(transportRouteRepository.findByIsActive(true));
    }
    
    @GetMapping("/type/{type}")
    public ResponseEntity<List<TransportRoute>> getRoutesByType(@PathVariable String type) {
        return ResponseEntity.ok(transportRouteRepository.findByRouteType(type));
    }
    
    @PostMapping
    public ResponseEntity<TransportRoute> createRoute(@Valid @RequestBody TransportRoute route) {
        return ResponseEntity.ok(transportRouteRepository.save(route));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<TransportRoute> updateRoute(@PathVariable String id, @Valid @RequestBody TransportRoute routeDetails) {
        return transportRouteRepository.findById(id).map(route -> {
            if (routeDetails.getRouteName() != null) route.setRouteName(routeDetails.getRouteName());
            if (routeDetails.getRouteCode() != null) route.setRouteCode(routeDetails.getRouteCode());
            if (routeDetails.getRouteType() != null) route.setRouteType(routeDetails.getRouteType());
            if (routeDetails.getIsActive() != null) route.setIsActive(routeDetails.getIsActive());
            if (routeDetails.getDescription() != null) route.setDescription(routeDetails.getDescription());
            return ResponseEntity.ok(transportRouteRepository.save(route));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<TransportRoute> toggleActive(@PathVariable String id) {
        return transportRouteRepository.findById(id).map(route -> {
            route.setIsActive(!route.getIsActive());
            return ResponseEntity.ok(transportRouteRepository.save(route));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoute(@PathVariable String id) {
        if (transportRouteRepository.existsById(id)) {
            transportRouteRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
