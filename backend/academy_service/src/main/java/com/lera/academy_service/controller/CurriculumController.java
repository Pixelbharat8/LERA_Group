package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.Curriculum;
import com.lera.academy_service.repository.CurriculumRepository;
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
@RequestMapping("/api/curriculum")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class CurriculumController {
    
    private final CurriculumRepository curriculumRepository;
    
    @GetMapping
    public ResponseEntity<List<Curriculum>> getAllCurriculum(Pageable pageable) {
        return ResponseEntity.ok(curriculumRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Curriculum> getCurriculumById(@PathVariable UUID id) {
        return curriculumRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Curriculum>> getCurriculumByCourse(@PathVariable UUID courseId) {
        return ResponseEntity.ok(curriculumRepository.findByCourseId(courseId));
    }
    
    @GetMapping("/grade/{gradeLevel}")
    public ResponseEntity<List<Curriculum>> getCurriculumByGradeLevel(@PathVariable String gradeLevel) {
        return ResponseEntity.ok(curriculumRepository.findByGradeLevel(gradeLevel));
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<Curriculum>> getActiveCurriculum() {
        return ResponseEntity.ok(curriculumRepository.findByIsActive(true));
    }
    
    @PostMapping
    public ResponseEntity<Curriculum> createCurriculum(@Valid @RequestBody Curriculum curriculum) {
        return ResponseEntity.ok(curriculumRepository.save(curriculum));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Curriculum> updateCurriculum(@PathVariable UUID id, @Valid @RequestBody Curriculum curriculumDetails) {
        return curriculumRepository.findById(id).map(curriculum -> {
            if (curriculumDetails.getName() != null) curriculum.setName(curriculumDetails.getName());
            if (curriculumDetails.getNameVi() != null) curriculum.setNameVi(curriculumDetails.getNameVi());
            if (curriculumDetails.getDescription() != null) curriculum.setDescription(curriculumDetails.getDescription());
            if (curriculumDetails.getDescriptionVi() != null) curriculum.setDescriptionVi(curriculumDetails.getDescriptionVi());
            if (curriculumDetails.getGradeLevel() != null) curriculum.setGradeLevel(curriculumDetails.getGradeLevel());
            if (curriculumDetails.getVersion() != null) curriculum.setVersion(curriculumDetails.getVersion());
            if (curriculumDetails.getIsActive() != null) curriculum.setIsActive(curriculumDetails.getIsActive());
            if (curriculumDetails.getTotalHours() != null) curriculum.setTotalHours(curriculumDetails.getTotalHours());
            if (curriculumDetails.getTotalWeeks() != null) curriculum.setTotalWeeks(curriculumDetails.getTotalWeeks());
            if (curriculumDetails.getLessonsPerWeek() != null) curriculum.setLessonsPerWeek(curriculumDetails.getLessonsPerWeek());
            if (curriculumDetails.getAssessmentStrategy() != null) curriculum.setAssessmentStrategy(curriculumDetails.getAssessmentStrategy());
            if (curriculumDetails.getAssessmentStrategyVi() != null) curriculum.setAssessmentStrategyVi(curriculumDetails.getAssessmentStrategyVi());
            if (curriculumDetails.getHomeworkPolicy() != null) curriculum.setHomeworkPolicy(curriculumDetails.getHomeworkPolicy());
            if (curriculumDetails.getHomeworkPolicyVi() != null) curriculum.setHomeworkPolicyVi(curriculumDetails.getHomeworkPolicyVi());
            if (curriculumDetails.getTextbookName() != null) curriculum.setTextbookName(curriculumDetails.getTextbookName());
            if (curriculumDetails.getTextbookIsbn() != null) curriculum.setTextbookIsbn(curriculumDetails.getTextbookIsbn());
            if (curriculumDetails.getSupplementaryMaterials() != null) curriculum.setSupplementaryMaterials(curriculumDetails.getSupplementaryMaterials());
            if (curriculumDetails.getCenterId() != null) curriculum.setCenterId(curriculumDetails.getCenterId());
            return ResponseEntity.ok(curriculumRepository.save(curriculum));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCurriculum(@PathVariable UUID id) {
        if (curriculumRepository.existsById(id)) {
            curriculumRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
