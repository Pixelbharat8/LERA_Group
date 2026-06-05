package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.entity.TeacherSkillLevel;
import com.lera.academy_service.repository.TeacherSkillLevelRepository;
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
@RequestMapping("/api/teacher-skill-levels")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class TeacherSkillLevelController {
    
    private final TeacherSkillLevelRepository teacherSkillLevelRepository;
    private final AcademyAuthorizationService authz;

    @GetMapping
    public ResponseEntity<List<TeacherSkillLevel>> getAllSkillLevels(Pageable pageable) {
        return ResponseEntity.ok(teacherSkillLevelRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<TeacherSkillLevel> getSkillLevelById(@PathVariable UUID id) {
        return teacherSkillLevelRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<TeacherSkillLevel>> getSkillLevelsByTeacher(@PathVariable UUID teacherId) {
        authz.assertStaffOrOwnTeacherEntity(teacherId);
        return ResponseEntity.ok(teacherSkillLevelRepository.findByTeacherIdOrderByAssessedAtDesc(teacherId));
    }
    
    @GetMapping("/teacher/{teacherId}/category/{category}")
    public ResponseEntity<List<TeacherSkillLevel>> getSkillLevelsByCategory(
            @PathVariable UUID teacherId, @PathVariable String category) {
        authz.assertStaffOrOwnTeacherEntity(teacherId);
        return ResponseEntity.ok(teacherSkillLevelRepository.findByTeacherIdAndSkillCategory(teacherId, category));
    }
    
    @PostMapping
    public ResponseEntity<TeacherSkillLevel> createSkillLevel(@Valid @RequestBody TeacherSkillLevel skillLevel) {
        return ResponseEntity.ok(teacherSkillLevelRepository.save(skillLevel));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<TeacherSkillLevel> updateSkillLevel(@PathVariable UUID id, @Valid @RequestBody TeacherSkillLevel skillDetails) {
        return teacherSkillLevelRepository.findById(id).map(skillLevel -> {
            if (skillDetails.getSkillCategory() != null) skillLevel.setSkillCategory(skillDetails.getSkillCategory());
            if (skillDetails.getLevel() != null) skillLevel.setLevel(skillDetails.getLevel());
            if (skillDetails.getScore() != null) skillLevel.setScore(skillDetails.getScore());
            if (skillDetails.getAssessedBy() != null) skillLevel.setAssessedBy(skillDetails.getAssessedBy());
            if (skillDetails.getCertificationName() != null) skillLevel.setCertificationName(skillDetails.getCertificationName());
            return ResponseEntity.ok(teacherSkillLevelRepository.save(skillLevel));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSkillLevel(@PathVariable UUID id) {
        if (teacherSkillLevelRepository.existsById(id)) {
            teacherSkillLevelRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
