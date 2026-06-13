package com.lera.identity_service.repository;

import com.lera.identity_service.entity.WebsiteSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WebsiteSettingsRepository extends JpaRepository<WebsiteSettings, UUID> {
    
    Optional<WebsiteSettings> findBySettingKey(String settingKey);
    
    List<WebsiteSettings> findBySettingKeyStartingWith(String prefix);
    
    @Query("SELECT w FROM WebsiteSettings w WHERE w.settingKey IN :keys")
    List<WebsiteSettings> findBySettingKeyIn(List<String> keys);
    
    boolean existsBySettingKey(String settingKey);
    
    void deleteBySettingKey(String settingKey);
}
