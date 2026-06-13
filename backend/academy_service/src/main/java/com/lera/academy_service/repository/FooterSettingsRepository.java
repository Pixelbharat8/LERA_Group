package com.lera.academy_service.repository;

import com.lera.academy_service.entity.FooterSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FooterSettingsRepository extends JpaRepository<FooterSettings, UUID> {
    
    Optional<FooterSettings> findBySettingKey(String settingKey);
    
    List<FooterSettings> findBySection(String section);
    
    List<FooterSettings> findBySectionOrderByDisplayOrderAsc(String section);
    
    List<FooterSettings> findBySectionAndLanguageOrderByDisplayOrderAsc(String section, String language);
    
    List<FooterSettings> findByIsActiveTrueOrderBySectionAscDisplayOrderAsc();
    
    void deleteBySettingKey(String settingKey);
}
