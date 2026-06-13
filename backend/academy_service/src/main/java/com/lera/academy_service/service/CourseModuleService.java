package com.lera.academy_service.service;

import com.lera.academy_service.entity.CourseModule;
import com.lera.academy_service.repository.CourseModuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings({"NullAway", "DataFlowIssue", "nullness"})
public class CourseModuleService {

    private final CourseModuleRepository courseModuleRepository;

    @Transactional(readOnly = true)
    public List<CourseModule> getCourseModules(UUID courseId) {
        log.info("Fetching modules for course: {}", courseId);
        return courseModuleRepository.findByCourseIdOrderBySequenceAsc(courseId);
    }

    @Transactional(readOnly = true)
    public CourseModule getModuleById(UUID id) {
        return courseModuleRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Course module not found: " + id));
    }

    @Transactional
    public CourseModule createModule(CourseModule module) {
        log.info("Creating module for course: {}", module.getCourseId());
        
        // Set sequence if not provided
        if (module.getSequence() == null) {
            long count = courseModuleRepository.countByCourseId(module.getCourseId());
            module.setSequence((int) count + 1);
        }
        
        module.setCreatedAt(LocalDateTime.now());
        module.setUpdatedAt(LocalDateTime.now());
        
        return courseModuleRepository.save(module);
    }

    @Transactional
    public CourseModule updateModule(UUID id, CourseModule moduleDetails) {
        log.info("Updating module: {}", id);
        
        CourseModule module = getModuleById(id);
        
        module.setModuleName(moduleDetails.getModuleName());
        module.setModuleNameVi(moduleDetails.getModuleNameVi());
        module.setDescription(moduleDetails.getDescription());
        module.setDescriptionVi(moduleDetails.getDescriptionVi());
        module.setSequence(moduleDetails.getSequence());
        module.setDurationWeeks(moduleDetails.getDurationWeeks());
        module.setIsRequired(moduleDetails.getIsRequired());
        module.setUpdatedAt(LocalDateTime.now());
        
        return courseModuleRepository.save(module);
    }

    @Transactional
    public void deleteModule(UUID id) {
        log.info("Deleting module: {}", id);
        courseModuleRepository.deleteById(id);
    }

    @Transactional
    public void reorderModules(UUID courseId, List<UUID> moduleIds) {
        log.info("Reordering modules for course: {}", courseId);

        for (int i = 0; i < moduleIds.size(); i++) {
            UUID moduleId = moduleIds.get(i);
            final int sequence = i + 1;

            courseModuleRepository.findById(moduleId).ifPresent(module -> {
                module.setSequence(sequence);
                module.setUpdatedAt(LocalDateTime.now());
                courseModuleRepository.save(module);
            });
        }
    }
}
