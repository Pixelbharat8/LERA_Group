package com.lera.identity_service.repository;

import com.lera.identity_service.entity.SystemSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SystemSettingsRepository extends JpaRepository<SystemSettings, UUID> {
    
    Optional<SystemSettings> findBySettingKey(String settingKey);
    
    List<SystemSettings> findByCategory(String category);
    
    List<SystemSettings> findByIsPublic(Boolean isPublic);
    
    // Convenience derived query used by some services
    List<SystemSettings> findByIsPublicTrue();
}
