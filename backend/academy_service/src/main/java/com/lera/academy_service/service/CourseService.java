package com.lera.academy_service.service;

import com.lera.academy_service.entity.CourseProgram;
import com.lera.academy_service.repository.CourseProgramRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CourseService {

    private final CourseProgramRepository courseProgramRepository;

    @Cacheable(value = "courses", key = "'all'")
    public List<CourseProgram> findAll() {
        return courseProgramRepository.findAll();
    }

    public Page<CourseProgram> findAll(Pageable pageable) {
        return courseProgramRepository.findAll(pageable);
    }

    @Cacheable(value = "courses", key = "#id")
    public Optional<CourseProgram> findById(UUID id) {
        return courseProgramRepository.findById(id);
    }

    public Optional<CourseProgram> findByCode(String code) {
        return courseProgramRepository.findByCode(code);
    }

    @Cacheable(value = "courses", key = "'active'")
    public List<CourseProgram> findActive() {
        return courseProgramRepository.findByIsActiveTrue();
    }

    public List<CourseProgram> findActiveOrdered() {
        return courseProgramRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
    }

    public List<CourseProgram> findByCategory(String category) {
        return courseProgramRepository.findByCategory(category);
    }

    @Cacheable(value = "courses", key = "'featured'")
    public List<CourseProgram> findFeatured() {
        return courseProgramRepository.findByIsFeaturedTrue();
    }

    @Transactional
    @CacheEvict(value = "courses", allEntries = true)
    public CourseProgram create(CourseProgram program) {
        if (program.getCode() != null) {
            courseProgramRepository.findByCode(program.getCode()).ifPresent(p -> {
                throw new IllegalArgumentException("Program code already exists: " + program.getCode());
            });
        }
        program.setCreatedAt(LocalDateTime.now());
        CourseProgram saved = courseProgramRepository.save(program);
        log.info("Created course program id={} code={}", saved.getId(), saved.getCode());
        return saved;
    }

    @Transactional
    @CacheEvict(value = "courses", allEntries = true)
    public Optional<CourseProgram> update(UUID id, CourseProgram details) {
        return courseProgramRepository.findById(id).map(existing -> {
            if (details.getName() != null) existing.setName(details.getName());
            if (details.getDescription() != null) existing.setDescription(details.getDescription());
            if (details.getCategory() != null) existing.setCategory(details.getCategory());
            if (details.getLevel() != null) existing.setLevel(details.getLevel());
            if (details.getPrice() != null) existing.setPrice(details.getPrice());
            if (details.getAgeFrom() != null) existing.setAgeFrom(details.getAgeFrom());
            if (details.getAgeTo() != null) existing.setAgeTo(details.getAgeTo());
            if (details.getIsActive() != null) existing.setIsActive(details.getIsActive());
            if (details.getIsFeatured() != null) existing.setIsFeatured(details.getIsFeatured());
            existing.setUpdatedAt(LocalDateTime.now());
            return courseProgramRepository.save(existing);
        });
    }

    @Transactional
    @CacheEvict(value = "courses", allEntries = true)
    public boolean delete(UUID id) {
        if (courseProgramRepository.existsById(id)) {
            courseProgramRepository.deleteById(id);
            log.info("Deleted course program id={}", id);
            return true;
        }
        return false;
    }
}
