package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.FooterSettings;
import com.lera.academy_service.repository.FooterSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/footer-settings")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class FooterSettingsController {
    
    private final FooterSettingsRepository footerSettingsRepository;
    
    @GetMapping
    public ResponseEntity<List<FooterSettings>> getAllSettings() {
        return ResponseEntity.ok(footerSettingsRepository.findByIsActiveTrueOrderBySectionAscDisplayOrderAsc());
    }
    
    @GetMapping("/map")
    public ResponseEntity<Map<String, String>> getSettingsAsMap(Pageable pageable) {
        Map<String, String> settings = footerSettingsRepository.findAll(pageable).getContent().stream()
                .collect(Collectors.toMap(
                        FooterSettings::getSettingKey,
                        s -> s.getSettingValue() != null ? s.getSettingValue() : "",
                        (v1, v2) -> v1
                ));
        return ResponseEntity.ok(settings);
    }
    
    @GetMapping("/section/{section}")
    public ResponseEntity<List<FooterSettings>> getSettingsBySection(@PathVariable String section) {
        return ResponseEntity.ok(footerSettingsRepository.findBySectionOrderByDisplayOrderAsc(section));
    }
    
    @GetMapping("/section/{section}/language/{language}")
    public ResponseEntity<List<FooterSettings>> getSettingsBySectionAndLanguage(
            @PathVariable String section, @PathVariable String language) {
        return ResponseEntity.ok(footerSettingsRepository.findBySectionAndLanguageOrderByDisplayOrderAsc(section, language));
    }
    
    @GetMapping("/key/{key}")
    public ResponseEntity<FooterSettings> getSettingByKey(@PathVariable String key) {
        return footerSettingsRepository.findBySettingKey(key)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<FooterSettings> createSetting(@Valid @RequestBody FooterSettings setting) {
        setting.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.ok(footerSettingsRepository.save(setting));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<FooterSettings> updateSetting(@PathVariable UUID id, @Valid @RequestBody FooterSettings updatedSetting) {
        return footerSettingsRepository.findById(id).map(setting -> {
            setting.setSettingValue(updatedSetting.getSettingValue());
            setting.setSection(updatedSetting.getSection());
            setting.setLanguage(updatedSetting.getLanguage());
            setting.setDisplayOrder(updatedSetting.getDisplayOrder());
            setting.setIsActive(updatedSetting.getIsActive());
            setting.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(footerSettingsRepository.save(setting));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/key/{key}")
    public ResponseEntity<FooterSettings> updateSettingByKey(@PathVariable String key, @Valid @RequestBody Map<String, String> body) {
        String value = body.get("value");
        String section = body.get("section");
        String language = body.get("language");
        
        return footerSettingsRepository.findBySettingKey(key).map(setting -> {
            setting.setSettingValue(value);
            if (section != null) setting.setSection(section);
            if (language != null) setting.setLanguage(language);
            setting.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(footerSettingsRepository.save(setting));
        }).orElseGet(() -> {
            FooterSettings newSetting = new FooterSettings();
            newSetting.setSettingKey(key);
            newSetting.setSettingValue(value);
            if (section != null) newSetting.setSection(section);
            if (language != null) newSetting.setLanguage(language);
            newSetting.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(footerSettingsRepository.save(newSetting));
        });
    }
    
    @PostMapping("/batch")
    public ResponseEntity<List<FooterSettings>> saveBatch(@Valid @RequestBody List<Map<String, String>> settings) {
        List<FooterSettings> savedSettings = settings.stream().map(setting -> {
            String key = setting.get("settingKey");
            String value = setting.get("settingValue");
            String section = setting.get("section");
            String language = setting.get("language");
            
            return footerSettingsRepository.findBySettingKey(key).map(existing -> {
                existing.setSettingValue(value);
                if (section != null) existing.setSection(section);
                if (language != null) existing.setLanguage(language);
                existing.setUpdatedAt(LocalDateTime.now());
                return footerSettingsRepository.save(existing);
            }).orElseGet(() -> {
                FooterSettings newSetting = new FooterSettings();
                newSetting.setSettingKey(key);
                newSetting.setSettingValue(value);
                if (section != null) newSetting.setSection(section);
                if (language != null) newSetting.setLanguage(language);
                newSetting.setUpdatedAt(LocalDateTime.now());
                return footerSettingsRepository.save(newSetting);
            });
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(savedSettings);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSetting(@PathVariable UUID id) {
        if (footerSettingsRepository.existsById(id)) {
            footerSettingsRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
