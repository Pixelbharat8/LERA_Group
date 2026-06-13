package com.lera.identity_service.service;

import com.lera.identity_service.entity.SystemSettings;
import com.lera.identity_service.repository.SystemSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemSettingsService {

    private final SystemSettingsRepository systemSettingsRepository;

    @Transactional
    public SystemSettings createOrUpdateSetting(SystemSettings setting) {
        if (setting == null || setting.getSettingKey() == null) {
            throw new IllegalArgumentException("setting and settingKey must not be null");
        }
        log.info("Creating/Updating system setting - Key: {}", setting.getSettingKey());

        Optional<SystemSettings> existing = systemSettingsRepository
                .findBySettingKey(setting.getSettingKey());

        if (existing.isPresent()) {
            SystemSettings existingSetting = existing.get();
            existingSetting.setSettingValue(setting.getSettingValue());
            existingSetting.setDescription(setting.getDescription());
            existingSetting.setCategory(setting.getCategory());
            existingSetting.setIsPublic(setting.getIsPublic());

            SystemSettings updated = systemSettingsRepository.save(existingSetting);
            log.info("System setting updated: {}", setting.getSettingKey());
            return updated;
        } else {
            SystemSettings saved = systemSettingsRepository.save(setting);
            log.info("System setting created with ID: {}", saved.getId());
            return saved;
        }
    }

    @Transactional(readOnly = true)
    public Optional<SystemSettings> getSetting(String settingKey) {
        if (settingKey == null) {
            return Optional.empty();
        }
        log.debug("Fetching system setting - Key: {}", settingKey);
        return systemSettingsRepository.findBySettingKey(settingKey);
    }

    @Transactional(readOnly = true)
    public String getSettingValue(String settingKey, String defaultValue) {
        return getSetting(settingKey)
                .map(SystemSettings::getSettingValue)
                .orElse(defaultValue);
    }

    @Transactional(readOnly = true)
    public Integer getIntegerSetting(String settingKey, Integer defaultValue) {
        String value = getSettingValue(settingKey, null);
        if (value == null) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            log.warn("Invalid integer value for setting {}: {}", settingKey, value);
            return defaultValue;
        }
    }

    @Transactional(readOnly = true)
    public Boolean getBooleanSetting(String settingKey, Boolean defaultValue) {
        String value = getSettingValue(settingKey, null);
        if (value == null) {
            return defaultValue;
        }
        return Boolean.parseBoolean(value);
    }

    @Transactional(readOnly = true)
    public List<SystemSettings> getAllSettings() {
        log.debug("Fetching all system settings");
        return systemSettingsRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<SystemSettings> getPublicSettings() {
        log.debug("Fetching public system settings");
        return systemSettingsRepository.findByIsPublic(true);
    }

    @Transactional(readOnly = true)
    public List<SystemSettings> getSettingsByCategory(String category) {
        log.debug("Fetching system settings for category: {}", category);
        return systemSettingsRepository.findByCategory(category);
    }

    @Transactional(readOnly = true)
    public Optional<SystemSettings> getSettingById(UUID id) {
        if (id == null) {
            return Optional.empty();
        }
        log.debug("Fetching system setting by ID: {}", id);
        return systemSettingsRepository.findById(java.util.Objects.requireNonNull(id));
    }

    @Transactional
    public void deleteSetting(String settingKey) {
        if (settingKey == null) {
            throw new IllegalArgumentException("settingKey must not be null");
        }
        log.info("Deleting system setting - Key: {}", settingKey);

        SystemSettings setting = systemSettingsRepository.findBySettingKey(settingKey)
                .orElseThrow(() -> new IllegalArgumentException("System setting not found: " + settingKey));

        systemSettingsRepository.delete(java.util.Objects.requireNonNull(setting));
        log.info("System setting deleted successfully: {}", settingKey);
    }

    @Transactional
    public void bulkUpdateSettings(List<SystemSettings> settings) {
        if (settings == null) {
            return;
        }
        log.info("Bulk updating {} system settings", settings.size());

        for (SystemSettings setting : settings) {
            if (setting == null) {
                continue;
            }
            createOrUpdateSetting(setting);
        }

        log.info("Bulk update completed for system settings");
    }

    @Transactional
    public void resetToDefaults() {
        log.warn("Resetting all system settings to defaults");

        List<SystemSettings> defaults = List.of(
                SystemSettings.builder()
                        .settingKey("SYSTEM_NAME")
                        .settingValue("LERA Academy")
                        .description("System display name")
                        .category("General")
                        .isPublic(true)
                        .build(),
                SystemSettings.builder()
                        .settingKey("MAX_LOGIN_ATTEMPTS")
                        .settingValue("5")
                        .description("Maximum failed login attempts before lockout")
                        .category("Security")
                        .isPublic(false)
                        .build(),
                SystemSettings.builder()
                        .settingKey("SESSION_TIMEOUT_MINUTES")
                        .settingValue("30")
                        .description("User session timeout in minutes")
                        .category("Security")
                        .isPublic(false)
                        .build(),
                SystemSettings.builder()
                        .settingKey("MAINTENANCE_MODE")
                        .settingValue("false")
                        .description("System maintenance mode flag")
                        .category("System")
                        .isPublic(true)
                        .build()
        );

        for (SystemSettings setting : defaults) {
            createOrUpdateSetting(setting);
        }

        log.info("System settings reset to defaults completed");
    }
}
