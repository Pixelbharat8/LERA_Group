package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.CourseLesson;
import com.lera.academy_service.repository.CourseLessonRepository;
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
@RequestMapping("/api/course-lessons")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class CourseLessonController {
    
    private final CourseLessonRepository courseLessonRepository;
    
    @GetMapping
    public ResponseEntity<List<CourseLesson>> getAllLessons(Pageable pageable) {
        return ResponseEntity.ok(courseLessonRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CourseLesson> getLessonById(@PathVariable UUID id) {
        return courseLessonRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/module/{moduleId}")
    public ResponseEntity<List<CourseLesson>> getLessonsByModule(@PathVariable UUID moduleId) {
        return ResponseEntity.ok(courseLessonRepository.findByModuleIdOrderBySequenceAsc(moduleId));
    }
    
    @GetMapping("/module/{moduleId}/published")
    public ResponseEntity<List<CourseLesson>> getPublishedLessons(@PathVariable UUID moduleId) {
        return ResponseEntity.ok(courseLessonRepository.findByModuleIdAndIsPublishedTrue(moduleId));
    }
    
    @GetMapping("/type/{type}")
    public ResponseEntity<List<CourseLesson>> getLessonsByType(@PathVariable String type) {
        return ResponseEntity.ok(courseLessonRepository.findByLessonType(type));
    }
    
    @GetMapping("/module/{moduleId}/count")
    public ResponseEntity<Long> countLessonsByModule(@PathVariable UUID moduleId) {
        return ResponseEntity.ok(courseLessonRepository.countByModuleId(moduleId));
    }
    
    @PostMapping
    public ResponseEntity<CourseLesson> createLesson(@Valid @RequestBody CourseLesson lesson) {
        return ResponseEntity.ok(courseLessonRepository.save(lesson));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CourseLesson> updateLesson(@PathVariable UUID id, @Valid @RequestBody CourseLesson lessonDetails) {
        return courseLessonRepository.findById(id).map(lesson -> {
            if (lessonDetails.getLessonName() != null) lesson.setLessonName(lessonDetails.getLessonName());
            if (lessonDetails.getContent() != null) lesson.setContent(lessonDetails.getContent());
            if (lessonDetails.getLessonType() != null) lesson.setLessonType(lessonDetails.getLessonType());
            if (lessonDetails.getSequence() != null) lesson.setSequence(lessonDetails.getSequence());
            if (lessonDetails.getDurationMinutes() != null) lesson.setDurationMinutes(lessonDetails.getDurationMinutes());
            if (lessonDetails.getIsPublished() != null) lesson.setIsPublished(lessonDetails.getIsPublished());
            if (lessonDetails.getDescription() != null) lesson.setDescription(lessonDetails.getDescription());
            return ResponseEntity.ok(courseLessonRepository.save(lesson));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PatchMapping("/{id}/publish")
    public ResponseEntity<CourseLesson> publishLesson(@PathVariable UUID id) {
        return courseLessonRepository.findById(id).map(lesson -> {
            lesson.setIsPublished(true);
            return ResponseEntity.ok(courseLessonRepository.save(lesson));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLesson(@PathVariable UUID id) {
        if (courseLessonRepository.existsById(id)) {
            courseLessonRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
