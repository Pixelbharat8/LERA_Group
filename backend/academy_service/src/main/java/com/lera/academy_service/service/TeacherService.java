package com.lera.academy_service.service;

import com.lera.academy_service.entity.Teacher;
import com.lera.academy_service.repository.TeacherRepository;
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
public class TeacherService {

    private final TeacherRepository teacherRepository;

    @Cacheable(value = "teachers", key = "'all'")
    public List<Teacher> findAll() {
        return teacherRepository.findAll();
    }

    public Page<Teacher> findAll(Pageable pageable) {
        return teacherRepository.findAll(pageable);
    }

    @Cacheable(value = "teachers", key = "#id")
    public Optional<Teacher> findById(UUID id) {
        return teacherRepository.findById(id);
    }

    @Cacheable(value = "teachers", key = "'code-' + #teacherCode")
    public Optional<Teacher> findByCode(String teacherCode) {
        return teacherRepository.findByTeacherCode(teacherCode);
    }

    public Optional<Teacher> findByUserId(UUID userId) {
        return teacherRepository.findByUserId(userId);
    }

    @Cacheable(value = "teachers", key = "'center-' + #centerId")
    public List<Teacher> findByCenterId(UUID centerId) {
        return teacherRepository.findByCenterId(centerId);
    }

    public List<Teacher> findByStatus(String status) {
        return teacherRepository.findByStatus(status);
    }

    public List<Teacher> findByCenterIdAndStatus(UUID centerId, String status) {
        return teacherRepository.findByCenterIdAndStatus(centerId, status);
    }

    @Cacheable(value = "teachers", key = "'featured'")
    public List<Teacher> findFeatured() {
        return teacherRepository.findByIsFeaturedTrue();
    }

    public List<Teacher> findBySpecialization(String specialization) {
        return teacherRepository.findBySpecializationContaining(specialization);
    }

    public List<Teacher> search(String keyword) {
        return teacherRepository.searchTeachers(keyword);
    }

    @Cacheable(value = "teachers", key = "'count-center-' + #centerId")
    public long countByCenterId(UUID centerId) {
        return teacherRepository.countByCenterId(centerId);
    }

    @Transactional
    @CacheEvict(value = "teachers", allEntries = true)
    public Teacher create(Teacher teacher) {
        if (teacher.getTeacherCode() != null) {
            teacherRepository.findByTeacherCode(teacher.getTeacherCode()).ifPresent(t -> {
                throw new IllegalArgumentException("Teacher code already exists: " + teacher.getTeacherCode());
            });
        }
        if (teacher.getStatus() == null) teacher.setStatus("ACTIVE");
        teacher.setCreatedAt(LocalDateTime.now());
        Teacher saved = teacherRepository.save(teacher);
        log.info("Created teacher id={} code={}", saved.getId(), saved.getTeacherCode());
        return saved;
    }

    @Transactional
    @CacheEvict(value = "teachers", allEntries = true)
    public Optional<Teacher> update(UUID id, Teacher details) {
        return teacherRepository.findById(id).map(existing -> {
            if (details.getBio() != null) existing.setBio(details.getBio());
            if (details.getBioVi() != null) existing.setBioVi(details.getBioVi());
            if (details.getSpecialization() != null) existing.setSpecialization(details.getSpecialization());
            if (details.getQualification() != null) existing.setQualification(details.getQualification());
            if (details.getContractType() != null) existing.setContractType(details.getContractType());
            if (details.getYearsOfExperience() != null) existing.setYearsOfExperience(details.getYearsOfExperience());
            if (details.getHourlyRate() != null) existing.setHourlyRate(details.getHourlyRate());
            existing.setUpdatedAt(LocalDateTime.now());
            return teacherRepository.save(existing);
        });
    }

    @Transactional
    @CacheEvict(value = "teachers", allEntries = true)
    public Optional<Teacher> updateStatus(UUID id, String status) {
        return teacherRepository.findById(id).map(t -> {
            t.setStatus(status);
            t.setUpdatedAt(LocalDateTime.now());
            log.info("Updated teacher status id={} status={}", id, status);
            return teacherRepository.save(t);
        });
    }

    @Transactional
    @CacheEvict(value = "teachers", allEntries = true)
    public boolean delete(UUID id) {
        if (teacherRepository.existsById(id)) {
            teacherRepository.deleteById(id);
            log.info("Deleted teacher id={}", id);
            return true;
        }
        return false;
    }
}
