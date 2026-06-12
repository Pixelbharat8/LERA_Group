package com.lera.identity_service.controller;

import com.lera.identity_service.entity.SystemSettings;
import com.lera.identity_service.model.ApiResponse;
import com.lera.identity_service.repository.SystemSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/system-settings")
@RequiredArgsConstructor
public class SystemSettingsController {

    private final SystemSettingsRepository settingsRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SystemSettings>>> getAllSettings(Pageable pageable) {
        List<SystemSettings> settings = settingsRepository.findAll(pageable).getContent();
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    @GetMapping("/public")
    public ResponseEntity<ApiResponse<List<SystemSettings>>> getPublicSettings() {
        List<SystemSettings> settings = settingsRepository.findByIsPublicTrue();
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<List<SystemSettings>>> getByCategory(@PathVariable String category) {
        List<SystemSettings> settings = settingsRepository.findByCategory(category);
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    @GetMapping("/key/{key}")
    public ResponseEntity<ApiResponse<SystemSettings>> getByKey(@PathVariable String key) {
        return settingsRepository.findBySettingKey(key)
                .map(s -> ResponseEntity.ok(ApiResponse.success(s)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<?> createSetting(@Valid @RequestBody SystemSettings setting) {
        if (settingsRepository.findBySettingKey(setting.getSettingKey()).isPresent()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Setting with this key already exists"));
        }
        setting.setUpdatedAt(LocalDateTime.now());
        SystemSettings saved = settingsRepository.save(setting);
        return ResponseEntity.ok(ApiResponse.success(saved, "Setting created"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<ApiResponse<SystemSettings>> updateSetting(
            @PathVariable UUID id,
            @Valid @RequestBody SystemSettings setting) {
        return settingsRepository.findById(id)
                .map(existing -> {
                    existing.setSettingValue(setting.getSettingValue());
                    if (setting.getSettingType() != null) existing.setSettingType(setting.getSettingType());
                    if (setting.getCategory() != null) existing.setCategory(setting.getCategory());
                    if (setting.getDescription() != null) existing.setDescription(setting.getDescription());
                    if (setting.getIsPublic() != null) existing.setIsPublic(setting.getIsPublic());
                    existing.setUpdatedAt(LocalDateTime.now());
                    existing.setUpdatedBy(setting.getUpdatedBy());
                    SystemSettings saved = settingsRepository.save(existing);
                    return ResponseEntity.ok(ApiResponse.success(saved, "Setting updated"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/key/{key}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<ApiResponse<SystemSettings>> updateByKey(
            @PathVariable String key,
            @Valid @RequestBody Map<String, String> body) {
        return settingsRepository.findBySettingKey(key)
                .map(existing -> {
                    existing.setSettingValue(body.get("value"));
                    existing.setUpdatedAt(LocalDateTime.now());
                    SystemSettings saved = settingsRepository.save(existing);
                    return ResponseEntity.ok(ApiResponse.success(saved, "Setting updated"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<ApiResponse<List<SystemSettings>>> bulkUpdate(@Valid @RequestBody List<SystemSettings> settings) {
        List<SystemSettings> updated = new ArrayList<>();
        for (SystemSettings s : settings) {
            Optional<SystemSettings> existing = settingsRepository.findBySettingKey(s.getSettingKey());
            if (existing.isPresent()) {
                SystemSettings e = existing.get();
                e.setSettingValue(s.getSettingValue());
                e.setUpdatedAt(LocalDateTime.now());
                updated.add(settingsRepository.save(e));
            } else {
                s.setUpdatedAt(LocalDateTime.now());
                updated.add(settingsRepository.save(s));
            }
        }
        return ResponseEntity.ok(ApiResponse.success(updated, "Settings updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<ApiResponse<Void>> deleteSetting(@PathVariable UUID id) {
        if (!settingsRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        settingsRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Setting deleted"));
    }

    @GetMapping("/map")
    public ResponseEntity<Map<String, String>> getSettingsAsMap(Pageable pageable) {
        List<SystemSettings> settings = settingsRepository.findAll(pageable).getContent();
        Map<String, String> map = new HashMap<>();
        for (SystemSettings s : settings) {
            map.put(s.getSettingKey(), s.getSettingValue());
        }
        return ResponseEntity.ok(map);
    }
}
