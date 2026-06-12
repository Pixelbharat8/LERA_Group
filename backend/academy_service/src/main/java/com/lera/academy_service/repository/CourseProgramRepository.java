package com.lera.academy_service.repository;

import com.lera.academy_service.entity.CourseProgram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseProgramRepository extends JpaRepository<CourseProgram, UUID> {
    
    Optional<CourseProgram> findByCode(String code);
    
    boolean existsByCode(String code);
    
    List<CourseProgram> findByIsActiveTrue();
    
    List<CourseProgram> findByCategory(String category);
    
    List<CourseProgram> findByIsFeaturedTrue();
    
    List<CourseProgram> findByIsActiveTrueOrderByDisplayOrderAsc();
}
