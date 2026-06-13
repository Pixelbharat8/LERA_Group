package com.lera.identity_service.repository;

import com.lera.identity_service.entity.CustomFieldValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface CustomFieldValueRepository extends JpaRepository<CustomFieldValue, String> {
    
    List<CustomFieldValue> findByEntityId(String entityId);
    
    Optional<CustomFieldValue> findByCustomFieldIdAndEntityId(String customFieldId, String entityId);
    
    List<CustomFieldValue> findByCustomFieldId(String customFieldId);
    
    void deleteByEntityId(String entityId);
    
    void deleteByCustomFieldId(String customFieldId);
    
    @Query("SELECT cfv FROM CustomFieldValue cfv " +
           "JOIN cfv.customField cf " +
           "WHERE cfv.entityId = :entityId " +
           "AND cf.entityType = :entityType")
    List<CustomFieldValue> findByEntityIdAndEntityType(
        @Param("entityId") String entityId,
        @Param("entityType") String entityType);
    
    boolean existsByCustomFieldIdAndEntityId(String customFieldId, String entityId);
    
    @Query("SELECT COUNT(cfv) FROM CustomFieldValue cfv WHERE cfv.customFieldId = :customFieldId")
    Long countByCustomFieldId(@Param("customFieldId") String customFieldId);
}
