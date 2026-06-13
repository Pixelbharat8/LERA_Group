package com.lera.academy_service.service;

import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.repository.ClassRepository;
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
public class ClassService {

    private final ClassRepository classRepository;
    private final ClassRosterNotificationService classRosterNotificationService;

    @Cacheable(value = "classes", key = "'all'")
    public List<ClassEntity> findAll() {
        return classRepository.findAll();
    }

    public Page<ClassEntity> findAll(Pageable pageable) {
        return classRepository.findAll(pageable);
    }

    @Cacheable(value = "classes", key = "#id")
    public Optional<ClassEntity> findById(UUID id) {
        return classRepository.findById(id);
    }

    @Cacheable(value = "classes", key = "'center-' + #centerId")
    public List<ClassEntity> findByCenterId(UUID centerId) {
        return classRepository.findByCenterId(centerId);
    }

    public List<ClassEntity> findByTeacherId(UUID teacherId) {
        return classRepository.findByTeacherId(teacherId);
    }

    public List<ClassEntity> findByProgramId(UUID programId) {
        return classRepository.findByProgramId(programId);
    }

    public List<ClassEntity> findByStatus(String status) {
        return classRepository.findByStatus(status);
    }

    public List<ClassEntity> findByCenterIdAndStatus(UUID centerId, String status) {
        return classRepository.findByCenterIdAndStatus(centerId, status);
    }

    public List<ClassEntity> findAvailable(UUID centerId) {
        return classRepository.findAvailableClasses(centerId);
    }

    @Transactional
    @CacheEvict(value = "classes", allEntries = true)
    public ClassEntity create(ClassEntity cls) {
        if (cls.getStatus() == null) cls.setStatus("OPEN");
        cls.setCreatedAt(LocalDateTime.now());
        ClassEntity saved = classRepository.save(cls);
        log.info("Created class id={} name={}", saved.getId(), saved.getName());
        return saved;
    }

    @Transactional
    @CacheEvict(value = "classes", allEntries = true)
    public Optional<ClassEntity> update(UUID id, ClassEntity details) {
        return classRepository.findById(id).map(existing -> {
            ClassEntity before = ClassRosterNotificationService.snapshot(existing);
            if (details.getName() != null) existing.setName(details.getName());
            if (details.getRoom() != null) existing.setRoom(details.getRoom());
            if (details.getTeacherId() != null) existing.setTeacherId(details.getTeacherId());
            if (details.getAssistantTeacherId() != null) existing.setAssistantTeacherId(details.getAssistantTeacherId());
            if (details.getScheduleDays() != null) existing.setScheduleDays(details.getScheduleDays());
            if (details.getScheduleTimeStart() != null) existing.setScheduleTimeStart(details.getScheduleTimeStart());
            if (details.getScheduleTimeEnd() != null) existing.setScheduleTimeEnd(details.getScheduleTimeEnd());
            if (details.getStartDate() != null) existing.setStartDate(details.getStartDate());
            if (details.getEndDate() != null) existing.setEndDate(details.getEndDate());
            if (details.getMaxStudents() != null) existing.setMaxStudents(details.getMaxStudents());
            if (details.getProgramId() != null) existing.setProgramId(details.getProgramId());
            if (details.getLevelId() != null) existing.setLevelId(details.getLevelId());
            existing.setUpdatedAt(LocalDateTime.now());
            ClassEntity saved = classRepository.save(existing);
            try {
                classRosterNotificationService.onClassEntityUpdated(before, saved);
            } catch (Exception e) {
                log.warn("Class update notification skipped: {}", e.getMessage());
            }
            return saved;
        });
    }

    @Transactional
    @CacheEvict(value = "classes", allEntries = true)
    public Optional<ClassEntity> updateStatus(UUID id, String status) {
        return classRepository.findById(id).map(c -> {
            String previousStatus = c.getStatus();
            c.setStatus(status);
            c.setUpdatedAt(LocalDateTime.now());
            log.info("Updated class status id={} status={}", id, status);
            ClassEntity saved = classRepository.save(c);
            try {
                classRosterNotificationService.onClassStatusChanged(saved, previousStatus, status);
            } catch (Exception e) {
                log.warn("Class status notification skipped: {}", e.getMessage());
            }
            return saved;
        });
    }

    @Transactional
    @CacheEvict(value = "classes", allEntries = true)
    public boolean delete(UUID id) {
        if (classRepository.existsById(id)) {
            classRepository.deleteById(id);
            log.info("Deleted class id={}", id);
            return true;
        }
        return false;
    }
}
