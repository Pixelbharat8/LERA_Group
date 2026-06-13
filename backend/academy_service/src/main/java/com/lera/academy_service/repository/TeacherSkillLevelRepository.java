package com.lera.academy_service.repository;

import com.lera.academy_service.entity.TeacherSkillLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TeacherSkillLevelRepository extends JpaRepository<TeacherSkillLevel, UUID> {

    List<TeacherSkillLevel> findByTeacherIdOrderByAssessedAtDesc(UUID teacherId);

    List<TeacherSkillLevel> findByTeacherIdAndSkillCategory(UUID teacherId, String skillCategory);
}
