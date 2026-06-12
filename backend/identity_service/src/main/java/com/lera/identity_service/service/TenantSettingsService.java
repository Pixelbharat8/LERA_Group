package com.lera.identity_service.service;

import com.lera.identity_service.entity.TenantSettings;
import com.lera.identity_service.repository.TenantSettingsRepository;
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
public class TenantSettingsService {

    private final TenantSettingsRepository tenantSettingsRepository;

    @Transactional
    public TenantSettings createOrUpdateSetting(TenantSettings setting) {
        if (setting == null) {
            throw new IllegalArgumentException("setting must not be null");
        }
        if (setting.getTenantId() == null || setting.getSettingKey() == null) {
            throw new IllegalArgumentException("tenantId and settingKey must not be null");
        }

        log.info("Creating/Updating setting for tenant ID: {} - Key: {}",
                setting.getTenantId(), setting.getSettingKey());

        Optional<TenantSettings> existing = tenantSettingsRepository
                .findByTenantIdAndSettingKey(setting.getTenantId(), setting.getSettingKey());

        if (existing.isPresent()) {
            TenantSettings existingSetting = existing.get();
            existingSetting.setSettingValue(setting.getSettingValue());
            existingSetting.setDescription(setting.getDescription());

            TenantSettings updated = tenantSettingsRepository.save(existingSetting);
            log.info("Setting updated: {}", setting.getSettingKey());
            return updated;
        } else {
            TenantSettings saved = tenantSettingsRepository.save(setting);
            log.info("Setting created with ID: {}", saved.getId());
            return saved;
        }
    }

    @Transactional(readOnly = true)
    public Optional<TenantSettings> getSetting(UUID tenantId, String settingKey) {
        if (tenantId == null || settingKey == null) {
            return Optional.empty();
        }
        log.debug("Fetching setting for tenant ID: {} - Key: {}", tenantId, settingKey);
        return tenantSettingsRepository.findByTenantIdAndSettingKey(tenantId, settingKey);
    }

    @Transactional(readOnly = true)
    public String getSettingValue(UUID tenantId, String settingKey, String defaultValue) {
        return getSetting(tenantId, settingKey)
                .map(TenantSettings::getSettingValue)
                .orElse(defaultValue);
    }

    @Transactional(readOnly = true)
    public List<TenantSettings> getTenantSettings(UUID tenantId) {
        if (tenantId == null) {
            return List.of();
        }
        log.debug("Fetching all settings for tenant ID: {}", tenantId);
        return tenantSettingsRepository.findByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public Optional<TenantSettings> getSettingById(UUID id) {
        if (id == null) {
            return Optional.empty();
        }
        log.debug("Fetching setting by ID: {}", id);
        return tenantSettingsRepository.findById(java.util.Objects.requireNonNull(id));
    }

    @Transactional
    public void deleteSetting(UUID tenantId, String settingKey) {
        if (tenantId == null || settingKey == null) {
            throw new IllegalArgumentException("tenantId and settingKey must not be null");
        }
        log.info("Deleting setting for tenant ID: {} - Key: {}", tenantId, settingKey);

        TenantSettings setting = tenantSettingsRepository
                .findByTenantIdAndSettingKey(tenantId, settingKey)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Setting not found: " + settingKey + " for tenant: " + tenantId));

        tenantSettingsRepository.delete(java.util.Objects.requireNonNull(setting));
        log.info("Setting deleted successfully: {}", settingKey);
    }

    @Transactional
    public void deleteAllTenantSettings(UUID tenantId) {
        if (tenantId == null) {
            return;
        }
        log.info("Deleting all settings for tenant ID: {}", tenantId);

        List<TenantSettings> settings = tenantSettingsRepository.findByTenantId(tenantId);
        tenantSettingsRepository.deleteAll(java.util.Objects.requireNonNull(settings));

        log.info("All settings deleted for tenant: {}", tenantId);
    }

    @Transactional
    public void bulkUpdateSettings(UUID tenantId, List<TenantSettings> settings) {
        if (tenantId == null || settings == null) {
            throw new IllegalArgumentException("tenantId and settings must not be null");
        }
        log.info("Bulk updating {} settings for tenant ID: {}", settings.size(), tenantId);

        for (TenantSettings setting : settings) {
            if (setting == null) {
                continue;
            }
            setting.setTenantId(tenantId);
            createOrUpdateSetting(setting);
        }

        log.info("Bulk update completed for tenant: {}", tenantId);
    }
}
