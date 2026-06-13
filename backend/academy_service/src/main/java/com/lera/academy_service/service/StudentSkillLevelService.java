package com.lera.academy_service.service;

import com.lera.academy_service.entity.StudentSkillLevel;
import com.lera.academy_service.repository.StudentSkillLevelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings({"NullAway", "DataFlowIssue", "nullness"})
public class StudentSkillLevelService {

    private final StudentSkillLevelRepository studentSkillLevelRepository;

    @Transactional
    public StudentSkillLevel assessSkill(StudentSkillLevel skillLevel) {
        if (skillLevel == null || skillLevel.getStudentId() == null) {
            throw new IllegalArgumentException("skillLevel and studentId must not be null");
        }
        log.info("Assessing skill for student ID: {} - Category: {}",
                skillLevel.getStudentId(), skillLevel.getSkillCategory());

        // Validate score (0-100)
        if (skillLevel.getScore() != null) {
            if (skillLevel.getScore().compareTo(BigDecimal.ZERO) < 0 || skillLevel.getScore().compareTo(new BigDecimal("100")) > 0) {
                throw new IllegalArgumentException("Score must be between 0 and 100");
            }
        }

        skillLevel.setAssessedAt(LocalDate.now());

        StudentSkillLevel saved = studentSkillLevelRepository.save(skillLevel);
        log.info("Skill assessment recorded with ID: {}", saved.getId());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<StudentSkillLevel> getStudentSkillLevels(UUID studentId) {
        if (studentId == null) {
            return List.of();
        }
        log.debug("Fetching skill levels for student ID: {}", studentId);
        return studentSkillLevelRepository.findByStudentIdOrderByAssessedAtDesc(studentId);
    }

    @Transactional(readOnly = true)
    public List<StudentSkillLevel> getStudentSkillsByCategory(UUID studentId, String skillCategory) {
        if (studentId == null || skillCategory == null) {
            return List.of();
        }
        log.debug("Fetching {} skills for student ID: {}", skillCategory, studentId);
        return studentSkillLevelRepository.findByStudentIdAndSkillCategory(studentId, skillCategory);
    }

    @Transactional(readOnly = true)
    public Optional<StudentSkillLevel> getLatestSkillAssessment(UUID studentId, String skillCategory) {
        if (studentId == null || skillCategory == null) {
            return Optional.empty();
        }
        log.debug("Fetching latest {} assessment for student ID: {}", skillCategory, studentId);
        List<StudentSkillLevel> assessments = studentSkillLevelRepository
                .findByStudentIdAndSkillCategory(studentId, skillCategory);

        return assessments.isEmpty() ? Optional.empty() : Optional.of(assessments.get(0));
    }

    @Transactional(readOnly = true)
    public Optional<StudentSkillLevel> getSkillLevelById(UUID id) {
        if (id == null) {
            return Optional.empty();
        }
        log.debug("Fetching skill level by ID: {}", id);
        return studentSkillLevelRepository.findById(id);
    }

    @Transactional
    public StudentSkillLevel updateSkillLevel(UUID id, StudentSkillLevel skillDetails) {
        if (id == null) {
            throw new IllegalArgumentException("id must not be null");
        }
        log.info("Updating skill level ID: {}", id);

        StudentSkillLevel skillLevel = studentSkillLevelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Skill level not found with ID: " + id));

        if (skillDetails != null) {
            if (skillDetails.getSkillCategory() != null) {
                skillLevel.setSkillCategory(skillDetails.getSkillCategory());
            }
            if (skillDetails.getSkillName() != null) {
                skillLevel.setSkillName(skillDetails.getSkillName());
            }
            if (skillDetails.getLevel() != null) {
                skillLevel.setLevel(skillDetails.getLevel());
            }
            if (skillDetails.getScore() != null) {
                if (skillDetails.getScore().compareTo(BigDecimal.ZERO) < 0 || skillDetails.getScore().compareTo(new BigDecimal("100")) > 0) {
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
            if (skillDetails.getNotes() != null) {
                skillLevel.setNotes(skillDetails.getNotes());
            }
        }

        StudentSkillLevel updated = studentSkillLevelRepository.save(skillLevel);
        log.info("Skill level updated successfully: {}", id);
        return updated;
    }

    @Transactional
    public void deleteSkillLevel(UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("id must not be null");
        }
        log.info("Deleting skill level ID: {}", id);

        if (!studentSkillLevelRepository.existsById(id)) {
            throw new IllegalArgumentException("Skill level not found with ID: " + id);
        }

        studentSkillLevelRepository.deleteById(id);
        log.info("Skill level deleted successfully: {}", id);
    }

    @Transactional(readOnly = true)
    public Double getAverageScore(UUID studentId, String skillCategory) {
        if (studentId == null || skillCategory == null) {
            return 0.0;
        }
        log.debug("Calculating average score for student ID: {} - Category: {}", studentId, skillCategory);

        List<StudentSkillLevel> assessments = studentSkillLevelRepository
                .findByStudentIdAndSkillCategory(studentId, skillCategory);

        if (assessments.isEmpty()) {
            return 0.0;
        }

        double avg = assessments.stream()
                .map(StudentSkillLevel::getScore)
                .filter(java.util.Objects::nonNull)
                .mapToDouble(BigDecimal::doubleValue)
                .average()
                .orElse(0.0);

        return Math.round(avg * 100.0) / 100.0;
    }

    @Transactional(readOnly = true)
    public BigDecimal getHighestScore(UUID studentId, String skillCategory) {
        if (studentId == null || skillCategory == null) {
            return BigDecimal.ZERO;
        }
        log.debug("Finding highest score for student ID: {} - Category: {}", studentId, skillCategory);

        List<StudentSkillLevel> assessments = studentSkillLevelRepository
                .findByStudentIdAndSkillCategory(studentId, skillCategory);

        return assessments.stream()
                .map(StudentSkillLevel::getScore)
                .filter(java.util.Objects::nonNull)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
    }
}
