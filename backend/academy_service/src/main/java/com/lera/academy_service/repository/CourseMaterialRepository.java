package com.lera.academy_service.repository;

import com.lera.academy_service.entity.CourseMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CourseMaterialRepository extends JpaRepository<CourseMaterial, UUID> {

    List<CourseMaterial> findByLessonId(UUID lessonId);

    List<CourseMaterial> findByLessonIdOrderByDisplayOrderAsc(UUID lessonId);

    List<CourseMaterial> findByLessonIdAndMaterialType(UUID lessonId, String materialType);

    List<CourseMaterial> findByLessonIdAndIsRequiredTrue(UUID lessonId);

    List<CourseMaterial> findByMaterialType(String materialType);

    long countByLessonId(UUID lessonId);
}
