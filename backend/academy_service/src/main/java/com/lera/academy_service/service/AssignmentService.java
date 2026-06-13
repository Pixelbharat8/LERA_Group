package com.lera.academy_service.service;

import com.lera.academy_service.entity.Assignment;
import com.lera.academy_service.repository.AssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;

    public List<Assignment> findAll() {
        return assignmentRepository.findAll();
    }

    public Page<Assignment> findAll(Pageable pageable) {
        return assignmentRepository.findAll(pageable);
    }

    public Optional<Assignment> findById(Long id) {
        return assignmentRepository.findById(id);
    }

    public List<Assignment> findByClassId(UUID classId) {
        return assignmentRepository.findByClassId(classId);
    }

    public List<Assignment> findByCreatedBy(Long createdBy) {
        return assignmentRepository.findByCreatedBy(createdBy);
    }

    public List<Assignment> findByModuleId(Long moduleId) {
        return assignmentRepository.findByModuleId(moduleId);
    }

    public List<Assignment> findByType(String assignmentType) {
        return assignmentRepository.findByAssignmentType(assignmentType);
    }

    public List<Assignment> findByStudentId(UUID studentId) {
        return assignmentRepository.findByStudentId(studentId);
    }

    public List<Assignment> findHomeworkByStudentId(UUID studentId) {
        return assignmentRepository.findHomeworkByStudentId(studentId);
    }

    public List<Assignment> findAssessments() {
        return assignmentRepository.findAssessments();
    }

    public List<Assignment> findAssessmentsByClassId(UUID classId) {
        return assignmentRepository.findAssessmentsByClassId(classId);
    }

    @Transactional
    public Assignment create(Assignment assignment) {
        assignment.setCreatedAt(LocalDateTime.now());
        Assignment saved = assignmentRepository.save(assignment);
        log.info("Created assignment id={} title={}", saved.getId(), saved.getTitle());
        return saved;
    }

    @Transactional
    public Optional<Assignment> update(Long id, Assignment details) {
        return assignmentRepository.findById(id).map(existing -> {
            if (details.getTitle() != null) existing.setTitle(details.getTitle());
            if (details.getDescription() != null) existing.setDescription(details.getDescription());
            if (details.getInstructions() != null) existing.setInstructions(details.getInstructions());
            if (details.getDueDate() != null) existing.setDueDate(details.getDueDate());
            if (details.getMaxScore() != null) existing.setMaxScore(details.getMaxScore());
            if (details.getPassingScore() != null) existing.setPassingScore(details.getPassingScore());
            if (details.getDifficultyLevel() != null) existing.setDifficultyLevel(details.getDifficultyLevel());
            if (details.getIsPublished() != null) existing.setIsPublished(details.getIsPublished());
            return assignmentRepository.save(existing);
        });
    }

    @Transactional
    public boolean delete(Long id) {
        if (assignmentRepository.existsById(id)) {
            assignmentRepository.deleteById(id);
            log.info("Deleted assignment id={}", id);
            return true;
        }
        return false;
    }
}
