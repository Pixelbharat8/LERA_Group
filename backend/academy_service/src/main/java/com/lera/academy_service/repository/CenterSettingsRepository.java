package com.lera.academy_service.repository;

import com.lera.academy_service.entity.CenterSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CenterSettingsRepository extends JpaRepository<CenterSettings, UUID> {
    Optional<CenterSettings> findByCenterId(UUID centerId);
    Optional<CenterSettings> findBySettingKey(String settingKey);
    Optional<CenterSettings> findByCenterIdAndSettingKey(UUID centerId, String settingKey);
}
