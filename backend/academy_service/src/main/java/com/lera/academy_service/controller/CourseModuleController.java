package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.CourseModule;
import com.lera.academy_service.repository.CourseModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/course-modules")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class CourseModuleController {
    
    private final CourseModuleRepository courseModuleRepository;
    
    @GetMapping
    public ResponseEntity<List<CourseModule>> getAllModules(Pageable pageable) {
        return ResponseEntity.ok(courseModuleRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CourseModule> getModuleById(@PathVariable UUID id) {
        return courseModuleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<CourseModule>> getModulesByCourse(@PathVariable UUID courseId) {
        return ResponseEntity.ok(courseModuleRepository.findByCourseIdOrderBySequenceAsc(courseId));
    }
    
    @GetMapping("/course/{courseId}/required")
    public ResponseEntity<List<CourseModule>> getRequiredModules(@PathVariable UUID courseId) {
        return ResponseEntity.ok(courseModuleRepository.findByCourseIdAndIsRequiredTrue(courseId));
    }
    
    @GetMapping("/course/{courseId}/count")
    public ResponseEntity<Long> countModulesByCourse(@PathVariable UUID courseId) {
        return ResponseEntity.ok(courseModuleRepository.countByCourseId(courseId));
    }
    
    @PostMapping
    public ResponseEntity<CourseModule> createModule(@Valid @RequestBody CourseModule module) {
        return ResponseEntity.ok(courseModuleRepository.save(module));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CourseModule> updateModule(@PathVariable UUID id, @Valid @RequestBody CourseModule moduleDetails) {
        return courseModuleRepository.findById(id).map(module -> {
            if (moduleDetails.getModuleName() != null) module.setModuleName(moduleDetails.getModuleName());
            if (moduleDetails.getDescription() != null) module.setDescription(moduleDetails.getDescription());
            if (moduleDetails.getSequence() != null) module.setSequence(moduleDetails.getSequence());
            if (moduleDetails.getIsRequired() != null) module.setIsRequired(moduleDetails.getIsRequired());
            if (moduleDetails.getDurationWeeks() != null) module.setDurationWeeks(moduleDetails.getDurationWeeks());
            return ResponseEntity.ok(courseModuleRepository.save(module));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteModule(@PathVariable UUID id) {
        if (courseModuleRepository.existsById(id)) {
            courseModuleRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
