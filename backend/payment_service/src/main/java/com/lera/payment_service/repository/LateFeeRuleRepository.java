package com.lera.payment_service.repository;

import com.lera.payment_service.entity.LateFeeRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface LateFeeRuleRepository extends JpaRepository<LateFeeRule, UUID> {
    List<LateFeeRule> findByIsActiveTrue();
    List<LateFeeRule> findByCenterIdAndIsActiveTrue(UUID centerId);
    List<LateFeeRule> findByFeeType(String feeType);
}
