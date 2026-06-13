package com.lera.connect_service.repository;

import com.lera.connect_service.entity.ContentModerationRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContentModerationRuleRepository extends JpaRepository<ContentModerationRule, UUID> {
    
    List<ContentModerationRule> findByIsActiveTrue();
    
    @Query("SELECT r FROM ContentModerationRule r WHERE r.isActive = true AND (r.academyId = :academyId OR r.academyId IS NULL)")
    List<ContentModerationRule> findActiveRulesForAcademy(@Param("academyId") UUID academyId);
    
    @Query("SELECT r FROM ContentModerationRule r WHERE r.isActive = true AND r.academyId IS NULL")
    List<ContentModerationRule> findGlobalActiveRules();
    
    List<ContentModerationRule> findByAcademyId(UUID academyId);
    
    List<ContentModerationRule> findByCategory(String category);
    
    List<ContentModerationRule> findByRuleType(String ruleType);
    
    @Query("SELECT r FROM ContentModerationRule r WHERE r.isActive = true AND r.appliesToStudents = true")
    List<ContentModerationRule> findActiveStudentRules();
    
    @Query("SELECT r FROM ContentModerationRule r WHERE r.isActive = true AND r.severity = :severity")
    List<ContentModerationRule> findActiveBySeverity(@Param("severity") String severity);
}
