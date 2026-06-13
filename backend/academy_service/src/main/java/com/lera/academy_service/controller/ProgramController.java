package com.lera.academy_service.controller;

import com.lera.academy_service.entity.CourseProgram;
import com.lera.academy_service.repository.CourseProgramRepository;
import com.lera.academy_service.security.AcademyAuthorizationService;
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
@RequestMapping("/api/programs")
@RequiredArgsConstructor
public class ProgramController {
    
    private final CourseProgramRepository programRepository;
    private final AcademyAuthorizationService authz;
    
    @GetMapping
    public ResponseEntity<List<CourseProgram>> getAllPrograms(Pageable pageable) {
        authz.assertStaff();
        return ResponseEntity.ok(programRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<CourseProgram>> getActivePrograms() {
        return ResponseEntity.ok(programRepository.findByIsActiveTrue());
    }
    
    @GetMapping("/featured")
    public ResponseEntity<List<CourseProgram>> getFeaturedPrograms() {
        return ResponseEntity.ok(programRepository.findByIsFeaturedTrue());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CourseProgram> getProgramById(@PathVariable UUID id) {
        return programRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/code/{code}")
    public ResponseEntity<CourseProgram> getProgramByCode(@PathVariable String code) {
        return programRepository.findByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/category/{category}")
    public ResponseEntity<List<CourseProgram>> getProgramsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(programRepository.findByCategory(category));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<CourseProgram> createProgram(@Valid @RequestBody CourseProgram program) {
        return ResponseEntity.ok(programRepository.save(program));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<CourseProgram> updateProgram(@PathVariable UUID id, @Valid @RequestBody CourseProgram programDetails) {
        return programRepository.findById(id).map(program -> {
            if (programDetails.getName() != null) program.setName(programDetails.getName());
            if (programDetails.getNameVi() != null) program.setNameVi(programDetails.getNameVi());
            if (programDetails.getDescription() != null) program.setDescription(programDetails.getDescription());
            if (programDetails.getDescriptionVi() != null) program.setDescriptionVi(programDetails.getDescriptionVi());
            if (programDetails.getAgeFrom() != null) program.setAgeFrom(programDetails.getAgeFrom());
            if (programDetails.getAgeTo() != null) program.setAgeTo(programDetails.getAgeTo());
            if (programDetails.getCategory() != null) program.setCategory(programDetails.getCategory());
            if (programDetails.getLevel() != null) program.setLevel(programDetails.getLevel());
            if (programDetails.getPrice() != null) program.setPrice(programDetails.getPrice());
            if (programDetails.getImageUrl() != null) program.setImageUrl(programDetails.getImageUrl());
            if (programDetails.getColor() != null) program.setColor(programDetails.getColor());
            if (programDetails.getIsFeatured() != null) program.setIsFeatured(programDetails.getIsFeatured());
            if (programDetails.getIsActive() != null) program.setIsActive(programDetails.getIsActive());
            if (programDetails.getDisplayOrder() != null) program.setDisplayOrder(programDetails.getDisplayOrder());
            
            return ResponseEntity.ok(programRepository.save(program));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Void> deleteProgram(@PathVariable UUID id) {
        if (programRepository.existsById(id)) {
            programRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<CourseProgram> toggleActive(@PathVariable UUID id) {
        return programRepository.findById(id).map(program -> {
            program.setIsActive(!program.getIsActive());
            return ResponseEntity.ok(programRepository.save(program));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PatchMapping("/{id}/toggle-featured")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<CourseProgram> toggleFeatured(@PathVariable UUID id) {
        return programRepository.findById(id).map(program -> {
            program.setIsFeatured(!program.getIsFeatured());
            return ResponseEntity.ok(programRepository.save(program));
        }).orElse(ResponseEntity.notFound().build());
    }
}
