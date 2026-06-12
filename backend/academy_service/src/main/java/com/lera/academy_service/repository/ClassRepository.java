package com.lera.academy_service.repository;

import com.lera.academy_service.entity.ClassEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClassRepository extends JpaRepository<ClassEntity, UUID> {
    
    List<ClassEntity> findByCenterId(UUID centerId);
    
    List<ClassEntity> findByProgramId(UUID programId);
    
    List<ClassEntity> findByTeacherId(UUID teacherId);
    
    // For TA (Teaching Assistant) dashboard
    List<ClassEntity> findByAssistantTeacherId(UUID assistantTeacherId);
    
    List<ClassEntity> findByStatus(String status);
    
    List<ClassEntity> findByCenterIdAndStatus(UUID centerId, String status);
    
    @Query("SELECT c FROM ClassEntity c WHERE c.centerId = :centerId AND c.status = 'OPEN'")
    List<ClassEntity> findAvailableClasses(UUID centerId);
}
