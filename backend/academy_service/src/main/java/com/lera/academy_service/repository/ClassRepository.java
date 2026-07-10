package com.lera.academy_service.repository;

import com.lera.academy_service.entity.ClassEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClassRepository extends JpaRepository<ClassEntity, UUID> {

    /**
     * Fetch a class row with a PESSIMISTIC_WRITE lock so concurrent enrollments to the SAME class
     * serialize on it — makes the "count active enrollments then insert" capacity check atomic per
     * class and prevents overbooking past maxStudents under concurrency. (Enrollments to different
     * classes lock different rows, so there is no cross-class contention.)
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM ClassEntity c WHERE c.id = :id")
    Optional<ClassEntity> findByIdForUpdate(UUID id);
    
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
