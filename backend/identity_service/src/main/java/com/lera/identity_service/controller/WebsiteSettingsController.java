package com.lera.identity_service.controller;

import com.lera.identity_service.entity.WebsiteSettings;
import com.lera.identity_service.service.WebsiteSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/website-settings")
@RequiredArgsConstructor
@Tag(name = "Website Settings", description = "Dynamic website content management APIs")
public class WebsiteSettingsController {
    
    private final WebsiteSettingsService websiteSettingsService;
    
    /**
     * Get all website settings - PUBLIC endpoint for frontend
     */
    @GetMapping
    @Operation(summary = "Get all website settings", description = "Retrieves all dynamic content settings for the website")
    public ResponseEntity<Map<String, String>> getAllSettings() {
        return ResponseEntity.ok(websiteSettingsService.getAllSettings());
    }
    
    /**
     * Get grouped settings - PUBLIC endpoint for frontend
     */
    @GetMapping("/grouped")
    @Operation(summary = "Get grouped settings", description = "Retrieves settings grouped by category (contact, hero, social, etc.)")
    public ResponseEntity<Map<String, Map<String, String>>> getGroupedSettings() {
        return ResponseEntity.ok(websiteSettingsService.getGroupedSettings());
    }
    
    /**
     * Get settings by prefix - PUBLIC endpoint
     */
    @GetMapping("/prefix/{prefix}")
    @Operation(summary = "Get settings by prefix", description = "Retrieves all settings that start with the given prefix")
    public ResponseEntity<Map<String, String>> getSettingsByPrefix(@PathVariable String prefix) {
        return ResponseEntity.ok(websiteSettingsService.getSettingsByPrefix(prefix + "_"));
    }
    
    /**
     * Get a single setting - PUBLIC endpoint
     */
    @GetMapping("/{key}")
    @Operation(summary = "Get single setting", description = "Retrieves a single setting by its key")
    public ResponseEntity<String> getSetting(@PathVariable String key) {
        return websiteSettingsService.getSetting(key)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get multiple settings by keys - PUBLIC endpoint
     */
    @PostMapping("/batch")
    @Operation(summary = "Get multiple settings", description = "Retrieves multiple settings by their keys")
    public ResponseEntity<Map<String, String>> getSettingsByKeys(@Valid @RequestBody List<String> keys) {
        return ResponseEntity.ok(websiteSettingsService.getSettingsByKeys(keys));
    }
    
    /**
     * Update or create a single setting - ADMIN only
     */
    @PutMapping("/{key}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    @Operation(summary = "Update a setting", description = "Updates or creates a single setting (Admin only)")
    public ResponseEntity<WebsiteSettings> updateSetting(
            @PathVariable String key,
            @Valid @RequestBody String value) {
        return ResponseEntity.ok(websiteSettingsService.saveSetting(key, value));
    }
    
    /**
     * Bulk update settings - ADMIN only
     */
    @PutMapping("/bulk")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    @Operation(summary = "Bulk update settings", description = "Updates multiple settings at once (Admin only)")
    public ResponseEntity<Void> bulkUpdateSettings(@Valid @RequestBody Map<String, String> settings) {
        websiteSettingsService.saveAllSettings(settings);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Delete a setting - ADMIN only
     */
    @DeleteMapping("/{key}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    @Operation(summary = "Delete a setting", description = "Deletes a setting by its key (Admin only)")
    public ResponseEntity<Void> deleteSetting(@PathVariable String key) {
        websiteSettingsService.deleteSetting(key);
        return ResponseEntity.ok().build();
    }
}
