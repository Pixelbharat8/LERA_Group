package com.lera.identity_service.controller;

import com.lera.identity_service.entity.Center;
import com.lera.identity_service.service.CenterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/centers")
@RequiredArgsConstructor
public class CenterController {
    
    private final CenterService centerService;
    
    @GetMapping
    public ResponseEntity<List<Center>> getAllCenters() {
        return ResponseEntity.ok(centerService.getAllCenters());
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<Center>> getActiveCenters() {
        return ResponseEntity.ok(centerService.getActiveCenters());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Center> getCenterById(@PathVariable UUID id) {
        return centerService.getCenterById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/code/{code}")
    public ResponseEntity<Center> getCenterByCode(@PathVariable String code) {
        return centerService.getCenterByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/city/{city}")
    public ResponseEntity<List<Center>> getCentersByCity(@PathVariable String city) {
        return ResponseEntity.ok(centerService.getCentersByCity(city));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO')")
    public ResponseEntity<?> createCenter(@Valid @RequestBody Center center) {
        try {
            Center created = centerService.createCenter(center);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "An unexpected error occurred"));
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Center> updateCenter(@PathVariable UUID id, @Valid @RequestBody Center center) {
        return centerService.updateCenter(id, center)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO')")
    public ResponseEntity<Void> deleteCenter(@PathVariable UUID id) {
        if (centerService.deleteCenter(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Center> updateCenterStatus(@PathVariable UUID id, @RequestParam String status) {
        return centerService.updateCenterStatus(id, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
