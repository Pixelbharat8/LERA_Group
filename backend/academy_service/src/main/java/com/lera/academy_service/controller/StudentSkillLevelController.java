package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.security.CurrentUser;
import com.lera.academy_service.dto.PlacementRecordRequest;
import com.lera.academy_service.entity.StudentSkillLevel;
import com.lera.academy_service.repository.StudentSkillLevelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/student-skill-levels")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class StudentSkillLevelController {
    
    private final StudentSkillLevelRepository studentSkillLevelRepository;
    private final AcademyAuthorizationService authz;

    @GetMapping
    public ResponseEntity<List<StudentSkillLevel>> getAllSkillLevels(Pageable pageable) {
        return ResponseEntity.ok(studentSkillLevelRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<StudentSkillLevel> getSkillLevelById(@PathVariable UUID id) {
        return studentSkillLevelRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<StudentSkillLevel>> getSkillLevelsByStudent(@PathVariable UUID studentId) {
        authz.assertCanViewStudent(studentId);
        return ResponseEntity.ok(studentSkillLevelRepository.findByStudentIdOrderByAssessedAtDesc(studentId));
    }
    
    @GetMapping("/student/{studentId}/category/{category}")
    public ResponseEntity<List<StudentSkillLevel>> getSkillLevelsByCategory(
            @PathVariable UUID studentId, 
            @PathVariable String category) {
        authz.assertCanViewStudent(studentId);
        return ResponseEntity.ok(studentSkillLevelRepository.findByStudentIdAndSkillCategory(studentId, category));
    }
    
    @PostMapping
    public ResponseEntity<StudentSkillLevel> createSkillLevel(@Valid @RequestBody StudentSkillLevel skillLevel) {
        return ResponseEntity.ok(studentSkillLevelRepository.save(skillLevel));
    }

    /**
     * Record English placement / diagnostic (maps to {@link StudentSkillLevel} for band → class recommendations).
     */
    @PostMapping("/placement-record")
    public ResponseEntity<StudentSkillLevel> recordPlacement(@Valid @RequestBody PlacementRecordRequest req) {
        authz.assertCanViewStudent(req.getStudentId());
        String skillName = StringUtils.hasText(req.getBandOrTrack())
                ? req.getBandOrTrack().trim()
                : "Placement / diagnostic";
        StudentSkillLevel row = StudentSkillLevel.builder()
                .studentId(req.getStudentId())
                .skillCategory("ENGLISH")
                .skillName(skillName)
                .level(req.getLevel())
                .score(req.getScore())
                .assessedBy(CurrentUser.id().orElse(null))
                .assessedAt(LocalDate.now())
                .notes(req.getNotes())
                .build();
        return ResponseEntity.ok(studentSkillLevelRepository.save(row));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<StudentSkillLevel> updateSkillLevel(@PathVariable UUID id, @Valid @RequestBody StudentSkillLevel skillDetails) {
        return studentSkillLevelRepository.findById(id).map(skillLevel -> {
            if (skillDetails.getSkillCategory() != null) skillLevel.setSkillCategory(skillDetails.getSkillCategory());
            if (skillDetails.getSkillName() != null) skillLevel.setSkillName(skillDetails.getSkillName());
            if (skillDetails.getLevel() != null) skillLevel.setLevel(skillDetails.getLevel());
            if (skillDetails.getAssessedBy() != null) skillLevel.setAssessedBy(skillDetails.getAssessedBy());
            if (skillDetails.getNotes() != null) skillLevel.setNotes(skillDetails.getNotes());
            return ResponseEntity.ok(studentSkillLevelRepository.save(skillLevel));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSkillLevel(@PathVariable UUID id) {
        if (studentSkillLevelRepository.existsById(id)) {
            studentSkillLevelRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
