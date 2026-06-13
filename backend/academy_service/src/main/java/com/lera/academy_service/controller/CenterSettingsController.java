package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.CenterSettings;
import com.lera.academy_service.repository.CenterSettingsRepository;
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
@RequestMapping("/api/center-settings")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class CenterSettingsController {
    
    private final CenterSettingsRepository centerSettingsRepository;
    private final com.lera.academy_service.security.AcademyAuthorizationService authz;

    @GetMapping
    public ResponseEntity<List<CenterSettings>> getAllSettings(Pageable pageable) {
        return ResponseEntity.ok(centerSettingsRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CenterSettings> getSettingById(@PathVariable UUID id) {
        return centerSettingsRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/center/{centerId}")
    public ResponseEntity<CenterSettings> getSettingsByCenter(@PathVariable UUID centerId) {
        authz.effectiveListCenterId(centerId);   // 403 if a centre-bound caller requests another centre
        return centerSettingsRepository.findByCenterId(centerId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/key/{key}")
    public ResponseEntity<CenterSettings> getSettingByKey(@PathVariable String key) {
        return centerSettingsRepository.findBySettingKey(key)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/center/{centerId}/key/{key}")
    public ResponseEntity<CenterSettings> getSettingByCenterAndKey(@PathVariable UUID centerId, @PathVariable String key) {
        authz.effectiveListCenterId(centerId);   // 403 if a centre-bound caller requests another centre
        return centerSettingsRepository.findByCenterIdAndSettingKey(centerId, key)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<CenterSettings> createSetting(@Valid @RequestBody CenterSettings setting) {
        return ResponseEntity.ok(centerSettingsRepository.save(setting));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CenterSettings> updateSetting(@PathVariable UUID id, @Valid @RequestBody CenterSettings settingDetails) {
        return centerSettingsRepository.findById(id).map(setting -> {
            if (settingDetails.getSettingKey() != null) setting.setSettingKey(settingDetails.getSettingKey());
            if (settingDetails.getSettingValue() != null) setting.setSettingValue(settingDetails.getSettingValue());
            return ResponseEntity.ok(centerSettingsRepository.save(setting));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSetting(@PathVariable UUID id) {
        if (centerSettingsRepository.existsById(id)) {
            centerSettingsRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
