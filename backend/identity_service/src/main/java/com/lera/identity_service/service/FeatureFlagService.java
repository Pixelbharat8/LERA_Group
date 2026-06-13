package com.lera.identity_service.service;

import com.lera.identity_service.entity.FeatureFlag;
import com.lera.identity_service.repository.FeatureFlagRepository;
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
public class FeatureFlagService {

    private final FeatureFlagRepository featureFlagRepository;

    @Transactional(readOnly = true)
    public boolean isEnabled(String flagKey) {
        return featureFlagRepository.findByFlagKey(flagKey)
            .map(FeatureFlag::getIsEnabled)
            .orElse(false);
    }

    @Transactional(readOnly = true)
    public boolean isEnabledForTenant(String flagKey, UUID tenantId) {
        Optional<FeatureFlag> flag = featureFlagRepository.findByFlagKey(flagKey);
        
        if (flag.isEmpty() || !flag.get().getIsEnabled()) {
            return false;
        }
        
        // Check if tenant is in target list (if specified)
        String targetTenants = flag.get().getTargetTenants();
        if (targetTenants != null && !targetTenants.isEmpty()) {
            return targetTenants.contains(tenantId.toString());
        }
        
        return true;
    }

    @Transactional(readOnly = true)
    public List<FeatureFlag> getAllFlags() {
        return featureFlagRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<FeatureFlag> getEnabledFlags() {
        return featureFlagRepository.findByIsEnabled(true);
    }

    @Transactional
    public FeatureFlag createFlag(FeatureFlag flag) {
        log.info("Creating feature flag: {}", flag.getFlagKey());
        return featureFlagRepository.save(flag);
    }

    @Transactional
    public FeatureFlag updateFlag(UUID id, FeatureFlag flagDetails) {
        log.info("Updating feature flag: {}", id);
        
        FeatureFlag flag = featureFlagRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Feature flag not found: " + id));
        
        flag.setFlagName(flagDetails.getFlagName());
        flag.setDescription(flagDetails.getDescription());
        flag.setIsEnabled(flagDetails.getIsEnabled());
        flag.setRolloutPercentage(flagDetails.getRolloutPercentage());
        flag.setTargetTenants(flagDetails.getTargetTenants());
        flag.setTargetUsers(flagDetails.getTargetUsers());
        
        return featureFlagRepository.save(flag);
    }

    @Transactional
    public void toggleFlag(String flagKey) {
        featureFlagRepository.findByFlagKey(flagKey).ifPresent(flag -> {
            flag.setIsEnabled(!flag.getIsEnabled());
            featureFlagRepository.save(flag);
            log.info("Toggled feature flag {}: {}", flagKey, flag.getIsEnabled());
        });
    }
}
