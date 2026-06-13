package com.lera.academy_service.service;

import com.lera.academy_service.entity.CourseLesson;
import com.lera.academy_service.repository.CourseLessonRepository;
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
public class CourseLessonService {

    private final CourseLessonRepository courseLessonRepository;

    @Transactional(readOnly = true)
    public List<CourseLesson> getModuleLessons(UUID moduleId) {
        log.info("Fetching lessons for module: {}", moduleId);
        return courseLessonRepository.findByModuleIdOrderBySequenceAsc(moduleId);
    }

    @Transactional(readOnly = true)
    public List<CourseLesson> getPublishedLessons(UUID moduleId) {
        return courseLessonRepository.findByModuleIdAndIsPublishedTrue(moduleId);
    }

    @Transactional(readOnly = true)
    public CourseLesson getLessonById(UUID id) {
        return courseLessonRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Lesson not found: " + id));
    }

    @Transactional
    public CourseLesson createLesson(CourseLesson lesson) {
        log.info("Creating lesson for module: {}", lesson.getModuleId());
        
        // Set sequence if not provided
        if (lesson.getSequence() == null) {
            long count = courseLessonRepository.countByModuleId(lesson.getModuleId());
            lesson.setSequence((int) count + 1);
        }
        
        lesson.setCreatedAt(LocalDateTime.now());
        lesson.setUpdatedAt(LocalDateTime.now());
        
        return courseLessonRepository.save(lesson);
    }

    @Transactional
    public CourseLesson updateLesson(UUID id, CourseLesson lessonDetails) {
        log.info("Updating lesson: {}", id);
        
        CourseLesson lesson = getLessonById(id);
        
        lesson.setLessonName(lessonDetails.getLessonName());
        lesson.setLessonNameVi(lessonDetails.getLessonNameVi());
        lesson.setDescription(lessonDetails.getDescription());
        lesson.setDescriptionVi(lessonDetails.getDescriptionVi());
        lesson.setSequence(lessonDetails.getSequence());
        lesson.setDurationMinutes(lessonDetails.getDurationMinutes());
        lesson.setLessonType(lessonDetails.getLessonType());
        lesson.setObjectives(lessonDetails.getObjectives());
        lesson.setContent(lessonDetails.getContent());
        lesson.setIsPublished(lessonDetails.getIsPublished());
        lesson.setUpdatedAt(LocalDateTime.now());
        
        return courseLessonRepository.save(lesson);
    }

    @Transactional
    public void deleteLesson(UUID id) {
        log.info("Deleting lesson: {}", id);
        courseLessonRepository.deleteById(id);
    }

    @Transactional
    public CourseLesson publishLesson(UUID id) {
        CourseLesson lesson = getLessonById(id);
        lesson.setIsPublished(true);
        lesson.setUpdatedAt(LocalDateTime.now());
        return courseLessonRepository.save(lesson);
    }

    @Transactional
    public CourseLesson unpublishLesson(UUID id) {
        CourseLesson lesson = getLessonById(id);
        lesson.setIsPublished(false);
        lesson.setUpdatedAt(LocalDateTime.now());
        return courseLessonRepository.save(lesson);
    }
}
