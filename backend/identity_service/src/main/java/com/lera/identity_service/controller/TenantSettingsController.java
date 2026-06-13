package com.lera.identity_service.controller;

import com.lera.identity_service.entity.TenantSettings;
import com.lera.identity_service.repository.TenantSettingsRepository;
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
@RequestMapping("/api/tenant-settings")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF','STUDENT','PARENT')")
public class TenantSettingsController {
    
    private final TenantSettingsRepository tenantSettingsRepository;
    
    @GetMapping
    public ResponseEntity<List<TenantSettings>> getAllSettings(Pageable pageable) {
        return ResponseEntity.ok(tenantSettingsRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<TenantSettings> getSettingById(@PathVariable UUID id) {
        return tenantSettingsRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<TenantSettings>> getSettingsByTenantId(@PathVariable UUID tenantId) {
        return ResponseEntity.ok(tenantSettingsRepository.findByTenantId(tenantId));
    }
    
    @GetMapping("/tenant/{tenantId}/key/{key}")
    public ResponseEntity<TenantSettings> getSettingByTenantAndKey(
            @PathVariable UUID tenantId, 
            @PathVariable String key) {
        return tenantSettingsRepository.findByTenantIdAndSettingKey(tenantId, key)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Tenant/system settings are admin-only to mutate.
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
    @PostMapping
    public ResponseEntity<TenantSettings> createSetting(@Valid @RequestBody TenantSettings setting) {
        return ResponseEntity.ok(tenantSettingsRepository.save(setting));
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<TenantSettings> updateSetting(
            @PathVariable UUID id, 
            @Valid @RequestBody TenantSettings settingDetails) {
        return tenantSettingsRepository.findById(id).map(setting -> {
            if (settingDetails.getSettingKey() != null) setting.setSettingKey(settingDetails.getSettingKey());
            if (settingDetails.getSettingValue() != null) setting.setSettingValue(settingDetails.getSettingValue());
            return ResponseEntity.ok(tenantSettingsRepository.save(setting));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSetting(@PathVariable UUID id) {
        if (tenantSettingsRepository.existsById(id)) {
            tenantSettingsRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
