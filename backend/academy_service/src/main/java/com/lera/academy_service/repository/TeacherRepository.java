package com.lera.academy_service.repository;

import com.lera.academy_service.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, UUID> {
    
    Optional<Teacher> findByTeacherCode(String teacherCode);
    
    Optional<Teacher> findByUserId(UUID userId);
    
    List<Teacher> findByCenterId(UUID centerId);
    
    List<Teacher> findByStatus(String status);
    
    List<Teacher> findByCenterIdAndStatus(UUID centerId, String status);
    
    List<Teacher> findByIsFeaturedTrue();
    
    List<Teacher> findBySpecializationContaining(String specialization);
    
    @Query("SELECT t FROM Teacher t WHERE LOWER(t.bio) LIKE LOWER(CONCAT('%', :search, '%')) OR t.teacherCode LIKE CONCAT('%', :search, '%')")
    List<Teacher> searchTeachers(String search);
    
    long countByCenterId(UUID centerId);
}
