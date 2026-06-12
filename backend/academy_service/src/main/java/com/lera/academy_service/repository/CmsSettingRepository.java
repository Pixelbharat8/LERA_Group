package com.lera.academy_service.repository;

import com.lera.academy_service.entity.CmsSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CmsSettingRepository extends JpaRepository<CmsSetting, UUID> {
    
    Optional<CmsSetting> findBySettingKey(String settingKey);
    
    List<CmsSetting> findByCategory(String category);
    
    List<CmsSetting> findByCategoryOrderBySettingKeyAsc(String category);
}
