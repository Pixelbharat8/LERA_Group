package com.lera.academy_service.repository;

import com.lera.academy_service.entity.StudentSkillLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentSkillLevelRepository extends JpaRepository<StudentSkillLevel, UUID> {
    
    List<StudentSkillLevel> findByStudentId(UUID studentId);
    
    List<StudentSkillLevel> findByStudentIdAndSkillCategory(UUID studentId, String skillCategory);
    
    List<StudentSkillLevel> findByStudentIdOrderByAssessedAtDesc(UUID studentId);

    Optional<StudentSkillLevel> findFirstByStudentIdAndSkillCategoryAndNotesContaining(
            UUID studentId, String skillCategory, String notesFragment);

    Optional<StudentSkillLevel> findByStudentIdAndSourceLeadId(UUID studentId, UUID sourceLeadId);
}
