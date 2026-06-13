package com.lera.identity_service.controller;

import com.lera.identity_service.entity.FeatureFlag;
import com.lera.identity_service.repository.FeatureFlagRepository;
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
@RequestMapping("/api/feature-flags")
@RequiredArgsConstructor
public class FeatureFlagController {
    
    private final FeatureFlagRepository featureFlagRepository;
    
    @GetMapping
    public ResponseEntity<List<FeatureFlag>> getAllFlags(Pageable pageable) {
        return ResponseEntity.ok(featureFlagRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<FeatureFlag> getFlagById(@PathVariable UUID id) {
        return featureFlagRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/enabled")
    public ResponseEntity<List<FeatureFlag>> getEnabledFlags() {
        return ResponseEntity.ok(featureFlagRepository.findByIsEnabledTrue());
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<FeatureFlag> createFlag(@Valid @RequestBody FeatureFlag flag) {
        return ResponseEntity.ok(featureFlagRepository.save(flag));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<FeatureFlag> updateFlag(@PathVariable UUID id, @Valid @RequestBody FeatureFlag flagDetails) {
        return featureFlagRepository.findById(id).map(flag -> {
            if (flagDetails.getFlagName() != null) flag.setFlagName(flagDetails.getFlagName());
            if (flagDetails.getDescription() != null) flag.setDescription(flagDetails.getDescription());
            if (flagDetails.getIsEnabled() != null) flag.setIsEnabled(flagDetails.getIsEnabled());
            return ResponseEntity.ok(featureFlagRepository.save(flag));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<FeatureFlag> toggleFlag(@PathVariable UUID id) {
        return featureFlagRepository.findById(id).map(flag -> {
            flag.setIsEnabled(!flag.getIsEnabled());
            return ResponseEntity.ok(featureFlagRepository.save(flag));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<Void> deleteFlag(@PathVariable UUID id) {
        if (featureFlagRepository.existsById(id)) {
            featureFlagRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
