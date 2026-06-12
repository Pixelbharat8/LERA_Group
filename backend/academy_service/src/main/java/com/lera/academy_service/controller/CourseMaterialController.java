package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.CourseMaterial;
import com.lera.academy_service.repository.CourseMaterialRepository;
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
@RequestMapping("/api/course-materials")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class CourseMaterialController {
    
    private final CourseMaterialRepository courseMaterialRepository;
    
    @GetMapping
    public ResponseEntity<List<CourseMaterial>> getAllMaterials(Pageable pageable) {
        return ResponseEntity.ok(courseMaterialRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CourseMaterial> getMaterialById(@PathVariable UUID id) {
        return courseMaterialRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/lesson/{lessonId}")
    public ResponseEntity<List<CourseMaterial>> getMaterialsByLesson(@PathVariable UUID lessonId) {
        return ResponseEntity.ok(courseMaterialRepository.findByLessonId(lessonId));
    }
    
    @GetMapping("/type/{materialType}")
    public ResponseEntity<List<CourseMaterial>> getMaterialsByType(@PathVariable String materialType) {
        return ResponseEntity.ok(courseMaterialRepository.findByMaterialType(materialType));
    }
    
    /**
     * Get all presentations/PowerPoints - for teacher lesson preparation
     */
    @GetMapping("/presentations")
    public ResponseEntity<List<CourseMaterial>> getAllPresentations() {
        List<CourseMaterial> presentations = new java.util.ArrayList<>();
        presentations.addAll(courseMaterialRepository.findByMaterialType("presentation"));
        presentations.addAll(courseMaterialRepository.findByMaterialType("pptx"));
        presentations.addAll(courseMaterialRepository.findByMaterialType("ppt"));
        return ResponseEntity.ok(presentations);
    }
    
    /**
     * Get presentations for a specific lesson
     */
    @GetMapping("/lesson/{lessonId}/presentations")
    public ResponseEntity<List<CourseMaterial>> getLessonPresentations(@PathVariable UUID lessonId) {
        List<CourseMaterial> presentations = new java.util.ArrayList<>();
        presentations.addAll(courseMaterialRepository.findByLessonIdAndMaterialType(lessonId, "presentation"));
        presentations.addAll(courseMaterialRepository.findByLessonIdAndMaterialType(lessonId, "pptx"));
        presentations.addAll(courseMaterialRepository.findByLessonIdAndMaterialType(lessonId, "ppt"));
        return ResponseEntity.ok(presentations);
    }
    
    @PostMapping
    public ResponseEntity<CourseMaterial> createMaterial(@Valid @RequestBody CourseMaterial material) {
        return ResponseEntity.ok(courseMaterialRepository.save(material));
    }
    
    @PostMapping("/bulk")
    public ResponseEntity<List<CourseMaterial>> createBulkMaterials(@Valid @RequestBody List<CourseMaterial> materials) {
        return ResponseEntity.ok(courseMaterialRepository.saveAll(materials));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CourseMaterial> updateMaterial(@PathVariable UUID id, @Valid @RequestBody CourseMaterial details) {
        return courseMaterialRepository.findById(id).map(material -> {
            if (details.getMaterialName() != null) material.setMaterialName(details.getMaterialName());
            if (details.getMaterialType() != null) material.setMaterialType(details.getMaterialType());
            if (details.getFilePath() != null) material.setFilePath(details.getFilePath());
            if (details.getFileUrl() != null) material.setFileUrl(details.getFileUrl());
            return ResponseEntity.ok(courseMaterialRepository.save(material));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMaterial(@PathVariable UUID id) {
        if (courseMaterialRepository.existsById(id)) {
            courseMaterialRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
