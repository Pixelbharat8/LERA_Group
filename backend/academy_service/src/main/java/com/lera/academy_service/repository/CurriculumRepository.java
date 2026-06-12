package com.lera.academy_service.repository;

import com.lera.academy_service.entity.Curriculum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface CurriculumRepository extends JpaRepository<Curriculum, UUID> {
    List<Curriculum> findByCourseId(UUID courseId);
    List<Curriculum> findByGradeLevel(String gradeLevel);
    List<Curriculum> findByIsActive(Boolean isActive);
    List<Curriculum> findByCenterId(UUID centerId);
    List<Curriculum> findByCourseIdAndIsActive(UUID courseId, Boolean isActive);
}
