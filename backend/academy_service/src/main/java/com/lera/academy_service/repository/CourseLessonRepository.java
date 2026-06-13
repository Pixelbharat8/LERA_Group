package com.lera.academy_service.repository;

import com.lera.academy_service.entity.CourseLesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CourseLessonRepository extends JpaRepository<CourseLesson, UUID> {
    
    List<CourseLesson> findByModuleId(UUID moduleId);
    
    List<CourseLesson> findByModuleIdOrderBySequenceAsc(UUID moduleId);
    
    List<CourseLesson> findByModuleIdAndIsPublishedTrue(UUID moduleId);
    
    List<CourseLesson> findByLessonType(String lessonType);
    
    long countByModuleId(UUID moduleId);
}
