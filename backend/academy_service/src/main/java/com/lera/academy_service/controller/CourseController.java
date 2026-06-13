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
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {
    
    private final CourseProgramRepository courseProgramRepository;
    private final AcademyAuthorizationService authz;
    
    @GetMapping
    public ResponseEntity<List<CourseProgram>> getAllCourses(Pageable pageable) {
        authz.assertStaff();
        return ResponseEntity.ok(courseProgramRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<CourseProgram>> getActiveCourses() {
        return ResponseEntity.ok(courseProgramRepository.findByIsActiveTrueOrderByDisplayOrderAsc());
    }
    
    @GetMapping("/featured")
    public ResponseEntity<List<CourseProgram>> getFeaturedCourses() {
        return ResponseEntity.ok(courseProgramRepository.findByIsFeaturedTrue());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CourseProgram> getCourseById(@PathVariable UUID id) {
        return courseProgramRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/code/{code}")
    public ResponseEntity<CourseProgram> getCourseByCode(@PathVariable String code) {
        return courseProgramRepository.findByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/category/{category}")
    public ResponseEntity<List<CourseProgram>> getCoursesByCategory(@PathVariable String category) {
        return ResponseEntity.ok(courseProgramRepository.findByCategory(category));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<CourseProgram> createCourse(@Valid @RequestBody CourseProgram course) {
        if (courseProgramRepository.existsByCode(course.getCode())) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(courseProgramRepository.save(course));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACADEMIC_MANAGER')")
    public ResponseEntity<CourseProgram> updateCourse(@PathVariable UUID id, @Valid @RequestBody CourseProgram courseDetails) {
        return courseProgramRepository.findById(id).map(course -> {
            if (courseDetails.getName() != null) course.setName(courseDetails.getName());
            if (courseDetails.getNameVi() != null) course.setNameVi(courseDetails.getNameVi());
            if (courseDetails.getDescription() != null) course.setDescription(courseDetails.getDescription());
            if (courseDetails.getDescriptionVi() != null) course.setDescriptionVi(courseDetails.getDescriptionVi());
            if (courseDetails.getAgeFrom() != null) course.setAgeFrom(courseDetails.getAgeFrom());
            if (courseDetails.getAgeTo() != null) course.setAgeTo(courseDetails.getAgeTo());
            if (courseDetails.getCategory() != null) course.setCategory(courseDetails.getCategory());
            if (courseDetails.getLevel() != null) course.setLevel(courseDetails.getLevel());
            if (courseDetails.getPrice() != null) course.setPrice(courseDetails.getPrice());
            if (courseDetails.getImageUrl() != null) course.setImageUrl(courseDetails.getImageUrl());
            if (courseDetails.getColor() != null) course.setColor(courseDetails.getColor());
            if (courseDetails.getIsFeatured() != null) course.setIsFeatured(courseDetails.getIsFeatured());
            if (courseDetails.getIsActive() != null) course.setIsActive(courseDetails.getIsActive());
            if (courseDetails.getDisplayOrder() != null) course.setDisplayOrder(courseDetails.getDisplayOrder());
            
            return ResponseEntity.ok(courseProgramRepository.save(course));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Void> deleteCourse(@PathVariable UUID id) {
        if (courseProgramRepository.existsById(id)) {
            courseProgramRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Academy Service is running");
    }
}
