package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.CmsSetting;
import com.lera.academy_service.repository.CmsSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/cms-settings")
public class CmsSettingController {
    
    @Autowired
    private CmsSettingRepository cmsSettingRepository;
    
    @GetMapping
    @PreAuthorize(AcademyRoles.STAFF)
    public List<CmsSetting> getAllSettings(Pageable pageable) {
        return cmsSettingRepository.findAll(pageable).getContent();
    }
    
    @GetMapping("/category/{category}")
    @PreAuthorize(AcademyRoles.STAFF)
    public List<CmsSetting> getSettingsByCategory(@PathVariable String category) {
        return cmsSettingRepository.findByCategoryOrderBySettingKeyAsc(category);
    }
    
    @GetMapping("/key/{key}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<CmsSetting> getSettingByKey(@PathVariable String key) {
        return cmsSettingRepository.findBySettingKey(key)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    // SECURITY: the value/{key} and map/{category} reads are public (no auth), so they must only
    // expose website-display content — never allow dumping an arbitrary admin key/category.
    private static final java.util.Set<String> PUBLIC_CATEGORIES = java.util.Set.of(
            "homepage", "hero", "about", "contact", "courses", "gallery", "achievements", "header",
            "privacy", "terms", "social", "branding", "seo", "footer",
            "corporate", "portal", "placement", "book_trial", "enroll");

    private static final java.util.Set<String> PUBLIC_KEYS = java.util.Set.of(
            "footer_settings", "header_menu_items", "seo_settings", "seo_pages", "branding_settings",
            "branding_logo_url", "branding_logo_alt_text", "branding_logo_alt_text_vi",
            "branding_primary_color", "branding_secondary_color");

    private static boolean isPublicKey(String key) {
        if (key == null) return false;
        if (PUBLIC_KEYS.contains(key)) return true;
        for (String c : PUBLIC_CATEGORIES) {
            if (key.startsWith(c + "_")) return true; // page-namespaced content keys
        }
        return false;
    }

    @GetMapping("/value/{key}")
    public ResponseEntity<String> getSettingValueByKey(@PathVariable String key) {
        if (!isPublicKey(key)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body("");
        }
        return cmsSettingRepository.findBySettingKey(key)
                .map(setting -> ResponseEntity.ok(setting.getSettingValue()))
                .orElse(ResponseEntity.ok("")); // Return empty string instead of 404 for missing values
    }

    @GetMapping("/map")
    @PreAuthorize(AcademyRoles.STAFF)
    public Map<String, String> getSettingsAsMap(Pageable pageable) {
        return cmsSettingRepository.findAll(pageable).getContent().stream()
                .collect(Collectors.toMap(
                        CmsSetting::getSettingKey,
                        s -> s.getSettingValue() != null ? s.getSettingValue() : ""
                ));
    }

    @GetMapping("/map/{category}")
    public ResponseEntity<Map<String, String>> getSettingsAsMapByCategory(@PathVariable String category) {
        if (!PUBLIC_CATEGORIES.contains(category)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(cmsSettingRepository.findByCategory(category).stream()
                .collect(Collectors.toMap(
                        CmsSetting::getSettingKey,
                        s -> s.getSettingValue() != null ? s.getSettingValue() : ""
                )));
    }
    
    @PostMapping
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<CmsSetting> createSetting(@Valid @RequestBody CmsSetting setting) {
        return ResponseEntity.ok(cmsSettingRepository.save(setting));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<CmsSetting> updateSetting(@PathVariable UUID id, @Valid @RequestBody CmsSetting updatedSetting) {
        return cmsSettingRepository.findById(id).map(setting -> {
            setting.setSettingKey(updatedSetting.getSettingKey());
            setting.setSettingValue(updatedSetting.getSettingValue());
            setting.setSettingType(updatedSetting.getSettingType());
            setting.setCategory(updatedSetting.getCategory());
            setting.setDescription(updatedSetting.getDescription());
            return ResponseEntity.ok(cmsSettingRepository.save(setting));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/key/{key}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<CmsSetting> updateSettingByKey(@PathVariable String key, @Valid @RequestBody Map<String, String> body) {
        String value = body.get("value");
        String category = body.get("category");
        return cmsSettingRepository.findBySettingKey(key).map(setting -> {
            setting.setSettingValue(value);
            if (category != null) setting.setCategory(category);
            return ResponseEntity.ok(cmsSettingRepository.save(setting));
        }).orElseGet(() -> {
            CmsSetting newSetting = new CmsSetting();
            newSetting.setSettingKey(key);
            newSetting.setSettingValue(value);
            if (category != null) newSetting.setCategory(category);
            return ResponseEntity.ok(cmsSettingRepository.save(newSetting));
        });
    }
    
    @PostMapping("/batch")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<List<CmsSetting>> updateBatch(@Valid @RequestBody List<Map<String, String>> settings) {
        List<CmsSetting> savedSettings = settings.stream().map(setting -> {
            // Support both 'key'/'value' and 'settingKey'/'settingValue' formats
            String key = setting.get("settingKey") != null ? setting.get("settingKey") : setting.get("key");
            String value = setting.get("settingValue") != null ? setting.get("settingValue") : setting.get("value");
            String category = setting.get("category");
            
            return cmsSettingRepository.findBySettingKey(key).map(existing -> {
                existing.setSettingValue(value);
                if (category != null) existing.setCategory(category);
                return cmsSettingRepository.save(existing);
            }).orElseGet(() -> {
                CmsSetting newSetting = new CmsSetting();
                newSetting.setSettingKey(key);
                newSetting.setSettingValue(value);
                if (category != null) newSetting.setCategory(category);
                return cmsSettingRepository.save(newSetting);
            });
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(savedSettings);
    }
    
    @PutMapping("/batch")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<Map<String, Object>> updateBatchPut(@Valid @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, String>> settings = (List<Map<String, String>>) body.get("settings");
        if (settings == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "settings array required"));
        }
        
        List<CmsSetting> savedSettings = settings.stream().map(setting -> {
            // Support both 'key'/'value' and 'settingKey'/'settingValue' formats
            String key = setting.get("settingKey") != null ? setting.get("settingKey") : setting.get("key");
            String value = setting.get("settingValue") != null ? setting.get("settingValue") : setting.get("value");
            String category = setting.get("category");
            
            return cmsSettingRepository.findBySettingKey(key).map(existing -> {
                existing.setSettingValue(value);
                if (category != null) existing.setCategory(category);
                return cmsSettingRepository.save(existing);
            }).orElseGet(() -> {
                CmsSetting newSetting = new CmsSetting();
                newSetting.setSettingKey(key);
                newSetting.setSettingValue(value);
                if (category != null) newSetting.setCategory(category);
                return cmsSettingRepository.save(newSetting);
            });
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(Map.of("success", true, "count", savedSettings.size()));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<Void> deleteSetting(@PathVariable UUID id) {
        if (cmsSettingRepository.existsById(id)) {
            cmsSettingRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
