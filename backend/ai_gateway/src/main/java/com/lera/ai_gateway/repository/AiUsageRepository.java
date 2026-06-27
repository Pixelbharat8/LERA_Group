package com.lera.ai_gateway.repository;

import com.lera.ai_gateway.entity.AiUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AiUsageRepository extends JpaRepository<AiUsage, UUID> {
    Optional<AiUsage> findByUserIdAndPeriod(UUID userId, String period);
}
