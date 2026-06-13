package com.lera.identity_service.repository;

import com.lera.identity_service.entity.CustomField;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomFieldRepository extends JpaRepository<CustomField, String> {
    
    List<CustomField> findByEntityTypeOrderBySortOrder(String entityType);
    
    List<CustomField> findByEntityTypeAndIsActiveOrderBySortOrder(String entityType, Boolean isActive);
    
    List<CustomField> findByEntityTypeAndShowInTableAndIsActiveOrderBySortOrder(
        String entityType, Boolean showInTable, Boolean isActive);
    
    List<CustomField> findByEntityTypeAndShowInFormAndIsActiveOrderBySortOrder(
        String entityType, Boolean showInForm, Boolean isActive);
    
    Optional<CustomField> findByEntityTypeAndFieldName(String entityType, String fieldName);
    
    @Query("SELECT cf FROM CustomField cf WHERE cf.entityType = :entityType AND " +
           "(cf.centerId IS NULL OR cf.centerId = :centerId) ORDER BY cf.sortOrder")
    List<CustomField> findByEntityTypeAndCenterId(
        @Param("entityType") String entityType, 
        @Param("centerId") String centerId);
    
    boolean existsByEntityTypeAndFieldName(String entityType, String fieldName);
    
    void deleteByEntityTypeAndFieldName(String entityType, String fieldName);
    
    @Query("SELECT COUNT(cf) FROM CustomField cf WHERE cf.entityType = :entityType")
    Long countByEntityType(@Param("entityType") String entityType);
    
    @Query("SELECT DISTINCT cf.entityType FROM CustomField cf")
    List<String> findAllEntityTypes();
}
