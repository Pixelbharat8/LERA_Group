package com.lera.identity_service.repository;

import com.lera.identity_service.entity.TenantSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantSettingsRepository extends JpaRepository<TenantSettings, UUID> {
    
    List<TenantSettings> findByTenantId(UUID tenantId);
    
    Optional<TenantSettings> findByTenantIdAndSettingKey(UUID tenantId, String settingKey);
    
    void deleteByTenantIdAndSettingKey(UUID tenantId, String settingKey);
}
