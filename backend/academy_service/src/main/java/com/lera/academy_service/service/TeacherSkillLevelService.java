package com.lera.academy_service.service;

import com.lera.academy_service.entity.TeacherSkillLevel;
import com.lera.academy_service.repository.TeacherSkillLevelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeacherSkillLevelService {

    private final TeacherSkillLevelRepository teacherSkillLevelRepository;

    @Transactional
    public TeacherSkillLevel assessSkill(TeacherSkillLevel skillLevel) {
        if (skillLevel == null || skillLevel.getTeacherId() == null || skillLevel.getSkillCategory() == null) {
            throw new IllegalArgumentException("teacherId and skillCategory must not be null");
        }
        log.info("Assessing skill for teacher ID: {} - Category: {}",
                skillLevel.getTeacherId(), skillLevel.getSkillCategory());

        if (skillLevel.getScore() != null && (skillLevel.getScore() < 0 || skillLevel.getScore() > 100)) {
            throw new IllegalArgumentException("Score must be between 0 and 100");
        }

        skillLevel.setAssessedAt(LocalDate.now());

        TeacherSkillLevel saved = teacherSkillLevelRepository.save(skillLevel);
        log.info("Skill assessment recorded with ID: {}", saved.getId());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<TeacherSkillLevel> getTeacherSkillLevels(UUID teacherId) {
        if (teacherId == null) {
            return List.of();
        }
        log.debug("Fetching skill levels for teacher ID: {}", teacherId);
        return teacherSkillLevelRepository.findByTeacherIdOrderByAssessedAtDesc(teacherId);
    }

    @Transactional(readOnly = true)
    public List<TeacherSkillLevel> getTeacherSkillsByCategory(UUID teacherId, String skillCategory) {
        if (teacherId == null || skillCategory == null) {
            return List.of();
        }
        log.debug("Fetching {} skills for teacher ID: {}", skillCategory, teacherId);
        return teacherSkillLevelRepository.findByTeacherIdAndSkillCategory(teacherId, skillCategory);
    }

    @Transactional(readOnly = true)
    public Optional<TeacherSkillLevel> getLatestSkillAssessment(UUID teacherId, String skillCategory) {
        if (teacherId == null || skillCategory == null) {
            return Optional.empty();
        }
        log.debug("Fetching latest {} assessment for teacher ID: {}", skillCategory, teacherId);
        List<TeacherSkillLevel> assessments = teacherSkillLevelRepository
                .findByTeacherIdAndSkillCategory(teacherId, skillCategory);

        return assessments.isEmpty() ? Optional.empty() : Optional.of(assessments.get(0));
    }

    @Transactional(readOnly = true)
    public Optional<TeacherSkillLevel> getSkillLevelById(UUID id) {
        if (id == null) {
            return Optional.empty();
        }
        log.debug("Fetching skill level by ID: {}", id);
        return teacherSkillLevelRepository.findById(java.util.Objects.requireNonNull(id));
    }

    @Transactional
    public TeacherSkillLevel updateSkillLevel(UUID id, TeacherSkillLevel skillDetails) {
        if (id == null) {
            throw new IllegalArgumentException("id must not be null");
        }
        log.info("Updating skill level ID: {}", id);

        TeacherSkillLevel skillLevel = teacherSkillLevelRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Skill level not found with ID: " + id));

        if (skillDetails != null) {
            if (skillDetails.getSkillCategory() != null) {
                skillLevel.setSkillCategory(skillDetails.getSkillCategory());
            }
            if (skillDetails.getLevel() != null) {
                skillLevel.setLevel(skillDetails.getLevel());
            }
            if (skillDetails.getScore() != null) {
                if (skillDetails.getScore() < 0 || skillDetails.getScore() > 100) {
                    throw new IllegalArgumentException("Score must be between 0 and 100");
                }
                skillLevel.setScore(skillDetails.getScore());
            }
            if (skillDetails.getAssessedBy() != null) {
                skillLevel.setAssessedBy(skillDetails.getAssessedBy());
            }
            if (skillDetails.getAssessedAt() != null) {
                skillLevel.setAssessedAt(skillDetails.getAssessedAt());
            }
            if (skillDetails.getCertificationName() != null) {
                skillLevel.setCertificationName(skillDetails.getCertificationName());
            }
            if (skillDetails.getCertificationBody() != null) {
                skillLevel.setCertificationBody(skillDetails.getCertificationBody());
            }
            if (skillDetails.getCertificationDate() != null) {
                skillLevel.setCertificationDate(skillDetails.getCertificationDate());
            }
            if (skillDetails.getNotes() != null) {
                skillLevel.setNotes(skillDetails.getNotes());
            }
        }

        @SuppressWarnings("null")
        TeacherSkillLevel updated = teacherSkillLevelRepository.save(skillLevel);
        log.info("Skill level updated successfully: {}", id);
        return updated;
    }

    @Transactional
    public void deleteSkillLevel(UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("id must not be null");
        }
        log.info("Deleting skill level ID: {}", id);

        if (!teacherSkillLevelRepository.existsById(java.util.Objects.requireNonNull(id))) {
            throw new IllegalArgumentException("Skill level not found with ID: " + id);
        }

        teacherSkillLevelRepository.deleteById(java.util.Objects.requireNonNull(id));
        log.info("Skill level deleted successfully: {}", id);
    }

    @Transactional(readOnly = true)
    public Double getAverageScore(UUID teacherId, String skillCategory) {
        if (teacherId == null || skillCategory == null) {
            return 0.0;
        }
        log.debug("Calculating average score for teacher ID: {} - Category: {}", teacherId, skillCategory);

        List<TeacherSkillLevel> assessments = teacherSkillLevelRepository
                .findByTeacherIdAndSkillCategory(teacherId, skillCategory);

        if (assessments.isEmpty()) {
            return 0.0;
        }

        double avg = assessments.stream()
                .map(TeacherSkillLevel::getScore)
                .filter(java.util.Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0.0);

        return Math.round(avg * 100.0) / 100.0;
    }

    @Transactional(readOnly = true)
    public Integer getHighestScore(UUID teacherId, String skillCategory) {
        if (teacherId == null || skillCategory == null) {
            return 0;
        }
        log.debug("Finding highest score for teacher ID: {} - Category: {}", teacherId, skillCategory);

        List<TeacherSkillLevel> assessments = teacherSkillLevelRepository
                .findByTeacherIdAndSkillCategory(teacherId, skillCategory);

        return assessments.stream()
                .map(TeacherSkillLevel::getScore)
                .filter(java.util.Objects::nonNull)
                .mapToInt(Integer::intValue)
                .max()
                .orElse(0);
    }

    @Transactional(readOnly = true)
    public List<TeacherSkillLevel> getCertifiedSkills(UUID teacherId) {
        if (teacherId == null) {
            return List.of();
        }
        log.debug("Fetching certified skills for teacher ID: {}", teacherId);

        List<TeacherSkillLevel> allSkills = teacherSkillLevelRepository
                .findByTeacherIdOrderByAssessedAtDesc(teacherId);

        return allSkills.stream()
                .filter(skill -> skill.getCertificationName() != null && !skill.getCertificationName().isEmpty())
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean hasCertification(UUID teacherId, String certificationName) {
        if (teacherId == null || certificationName == null) {
            return false;
        }
        log.debug("Checking if teacher ID: {} has certification: {}", teacherId, certificationName);

        List<TeacherSkillLevel> skills = teacherSkillLevelRepository
                .findByTeacherIdOrderByAssessedAtDesc(teacherId);

        return skills.stream()
                .anyMatch(skill -> certificationName.equalsIgnoreCase(skill.getCertificationName()));
    }
}
