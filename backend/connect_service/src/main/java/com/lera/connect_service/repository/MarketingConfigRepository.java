package com.lera.connect_service.repository;

import com.lera.connect_service.entity.MarketingConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MarketingConfigRepository extends JpaRepository<MarketingConfig, UUID> {
    Optional<MarketingConfig> findByUserId(UUID userId);
}
