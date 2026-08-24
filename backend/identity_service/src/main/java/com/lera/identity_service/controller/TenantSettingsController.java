package com.lera.identity_service.controller;

import com.lera.identity_service.entity.TenantSettings;
import com.lera.identity_service.repository.TenantSettingsRepository;
import com.lera.identity_service.security.AuthUser;
import com.lera.identity_service.security.SecurityUtils;
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
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF')")
public class TenantSettingsController {
    
    private final TenantSettingsRepository tenantSettingsRepository;

    private static final String REDACTED = "••••••••";

    /** Roles allowed to manage (write) tenant settings — those may also read encrypted VALUES.
     *  TEACHER/STAFF can list settings but must not read encrypted secrets. */
    private static final java.util.Set<String> SETTINGS_MANAGERS = java.util.Set.of(
            "SUPER_ADMIN", "CHAIRMAN", "CEO", "DIRECTOR", "CENTER_MANAGER", "CENTER_ADMIN");

    private static boolean callerCanSeeSecrets() {
        return SecurityUtils.currentUser()
                .map(AuthUser::getRoleName)
                .map(r -> r != null && SETTINGS_MANAGERS.contains(r.toUpperCase()))
                .orElse(false);
    }

    /** As-is for managers / non-encrypted; otherwise a DETACHED copy with the value masked
     *  (never mutate the managed entity — open-in-view could flush a masked value to the DB). */
    private static TenantSettings sanitize(TenantSettings s, boolean canSeeSecrets) {
        if (canSeeSecrets || !Boolean.TRUE.equals(s.getIsEncrypted())) return s;
        return TenantSettings.builder()
                .id(s.getId())
                .tenantId(s.getTenantId())
                .settingKey(s.getSettingKey())
                .settingValue(REDACTED)
                .settingType(s.getSettingType())
                .description(s.getDescription())
                .isEncrypted(s.getIsEncrypted())
                .updatedAt(s.getUpdatedAt())
                .build();
    }

    @GetMapping
    public ResponseEntity<List<TenantSettings>> getAllSettings(Pageable pageable) {
        boolean canSeeSecrets = callerCanSeeSecrets();
        return ResponseEntity.ok(tenantSettingsRepository.findAll(pageable).getContent()
                .stream().map(s -> sanitize(s, canSeeSecrets)).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TenantSettings> getSettingById(@PathVariable UUID id) {
        boolean canSeeSecrets = callerCanSeeSecrets();
        return tenantSettingsRepository.findById(id)
                .map(s -> ResponseEntity.ok(sanitize(s, canSeeSecrets)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<TenantSettings>> getSettingsByTenantId(@PathVariable UUID tenantId) {
        boolean canSeeSecrets = callerCanSeeSecrets();
        return ResponseEntity.ok(tenantSettingsRepository.findByTenantId(tenantId)
                .stream().map(s -> sanitize(s, canSeeSecrets)).toList());
    }

    @GetMapping("/tenant/{tenantId}/key/{key}")
    public ResponseEntity<TenantSettings> getSettingByTenantAndKey(
            @PathVariable UUID tenantId,
            @PathVariable String key) {
        boolean canSeeSecrets = callerCanSeeSecrets();
        return tenantSettingsRepository.findByTenantIdAndSettingKey(tenantId, key)
                .map(s -> ResponseEntity.ok(sanitize(s, canSeeSecrets)))
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
