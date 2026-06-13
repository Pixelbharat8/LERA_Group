package com.lera.identity_service.service;

import com.lera.identity_service.entity.WebsiteSettings;
import com.lera.identity_service.repository.WebsiteSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebsiteSettingsService {
    
    private final WebsiteSettingsRepository websiteSettingsRepository;
    
    /**
     * Get all website settings as a map
     */
    public Map<String, String> getAllSettings() {
        List<WebsiteSettings> settings = websiteSettingsRepository.findAll();
        return settings.stream()
                .collect(Collectors.toMap(
                        WebsiteSettings::getSettingKey,
                        ws -> stripQuotes(ws.getSettingValue()),
                        (existing, replacement) -> existing
                ));
    }
    
    /**
     * Strip surrounding quotes from JSON string values
     */
    private String stripQuotes(String value) {
        if (value == null) return "";
        String trimmed = value.trim();
        if (trimmed.startsWith("\"") && trimmed.endsWith("\"") && trimmed.length() > 1) {
            return trimmed.substring(1, trimmed.length() - 1);
        }
        return trimmed;
    }
    
    /**
     * Get settings by prefix (e.g., "contact_", "hero_", "social_")
     */
    public Map<String, String> getSettingsByPrefix(String prefix) {
        List<WebsiteSettings> settings = websiteSettingsRepository.findBySettingKeyStartingWith(prefix);
        return settings.stream()
                .collect(Collectors.toMap(
                        WebsiteSettings::getSettingKey,
                        ws -> stripQuotes(ws.getSettingValue()),
                        (existing, replacement) -> existing
                ));
    }
    
    /**
     * Get a single setting by key
     */
    public Optional<String> getSetting(String key) {
        return websiteSettingsRepository.findBySettingKey(key)
                .map(ws -> stripQuotes(ws.getSettingValue()));
    }
    
    /**
     * Get multiple settings by keys
     */
    public Map<String, String> getSettingsByKeys(List<String> keys) {
        List<WebsiteSettings> settings = websiteSettingsRepository.findBySettingKeyIn(keys);
        return settings.stream()
                .collect(Collectors.toMap(
                        WebsiteSettings::getSettingKey,
                        ws -> stripQuotes(ws.getSettingValue()),
                        (existing, replacement) -> existing
                ));
    }
    
    /**
     * Update or create a setting
     */
    @Transactional
    public WebsiteSettings saveSetting(String key, String value) {
        WebsiteSettings setting = websiteSettingsRepository.findBySettingKey(key)
                .orElse(new WebsiteSettings());
        
        // Ensure value is properly formatted for JSONB (wrap in quotes if not already)
        String jsonValue = value;
        if (!value.startsWith("\"")) {
            jsonValue = "\"" + value + "\"";
        }
        
        setting.setSettingKey(key);
        setting.setSettingValue(jsonValue);
        setting.setUpdatedAt(LocalDateTime.now());
        
        return websiteSettingsRepository.save(setting);
    }
    
    /**
     * Bulk update settings
     */
    @Transactional
    public void saveAllSettings(Map<String, String> settings) {
        settings.forEach(this::saveSetting);
    }
    
    /**
     * Delete a setting by key
     */
    @Transactional
    public void deleteSetting(String key) {
        websiteSettingsRepository.deleteBySettingKey(key);
    }
    
    /**
     * Get grouped settings for frontend consumption
     */
    public Map<String, Map<String, String>> getGroupedSettings() {
        Map<String, String> all = getAllSettings();
        Map<String, Map<String, String>> grouped = new HashMap<>();
        
        // Group by prefix
        String[] prefixes = {"contact_", "hero_", "social_", "branding_", "meta_"};
        
        for (String prefix : prefixes) {
            String groupName = prefix.replace("_", "");
            Map<String, String> group = new HashMap<>();
            
            all.forEach((key, value) -> {
                if (key.startsWith(prefix)) {
                    String shortKey = key.substring(prefix.length());
                    group.put(shortKey, value);
                }
            });
            
            if (!group.isEmpty()) {
                grouped.put(groupName, group);
            }
        }
        
        // Add ungrouped settings
        Map<String, String> other = new HashMap<>();
        all.forEach((key, value) -> {
            boolean matched = false;
            for (String prefix : prefixes) {
                if (key.startsWith(prefix)) {
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                other.put(key, value);
            }
        });
        
        if (!other.isEmpty()) {
            grouped.put("general", other);
        }
        
        return grouped;
    }
}
