package com.lera.payment_service.repository;

import com.lera.payment_service.entity.FeeRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FeeRuleRepository extends JpaRepository<FeeRule, UUID> {
    
    List<FeeRule> findByIsActiveTrue();
    
    List<FeeRule> findByCategory(String category);
    
    List<FeeRule> findByCenterId(UUID centerId);
    
    List<FeeRule> findByCourseId(UUID courseId);
    
    List<FeeRule> findByScope(String scope);
    
    List<FeeRule> findByCenterIdAndIsActiveTrue(UUID centerId);
}
