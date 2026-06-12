package com.lera.academy_service.repository;

import com.lera.academy_service.entity.CourseModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CourseModuleRepository extends JpaRepository<CourseModule, UUID> {
    
    List<CourseModule> findByCourseId(UUID courseId);
    
    List<CourseModule> findByCourseIdOrderBySequenceAsc(UUID courseId);
    
    List<CourseModule> findByCourseIdAndIsRequiredTrue(UUID courseId);
    
    long countByCourseId(UUID courseId);
}
