package com.lera.academy_service.service;

import com.lera.academy_service.entity.Student;
import com.lera.academy_service.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class StudentService {

    private final StudentRepository studentRepository;

    @Cacheable(value = "students", key = "'all'")
    public List<Student> findAll() {
        return studentRepository.findAll();
    }

    public Page<Student> findAll(Pageable pageable) {
        return studentRepository.findAll(pageable);
    }

    @Cacheable(value = "students", key = "#id")
    public Optional<Student> findById(UUID id) {
        return studentRepository.findById(id);
    }

    /** Linked academy profile for the identity user (dashboard mobile MVP). */
    public Optional<Student> findByUserId(UUID userId) {
        if (userId == null) {
            return Optional.empty();
        }
        return studentRepository.findByUserId(userId);
    }

    @Cacheable(value = "students", key = "'code-' + #code")
    public Optional<Student> findByCode(String code) {
        return studentRepository.findByStudentCode(code);
    }

    @Cacheable(value = "students", key = "'center-' + #centerId")
    public List<Student> findByCenterId(UUID centerId) {
        return studentRepository.findByCenterId(centerId);
    }

    public List<Student> findByParentId(UUID parentId) {
        return studentRepository.findByParentId(parentId);
    }

    public List<Student> search(String query) {
        return studentRepository.searchStudents(query);
    }

    public List<Student> searchInCenter(String query, UUID centerId) {
        return studentRepository.searchStudentsInCenter(query, centerId);
    }

    @Cacheable(value = "students", key = "'count-center-' + #centerId")
    public long countByCenterId(UUID centerId) {
        return studentRepository.countByCenterId(centerId);
    }

    @Transactional
    @CacheEvict(value = "students", allEntries = true)
    public Student create(Student student) {
        if (student.getStudentCode() != null) {
            studentRepository.findByStudentCode(student.getStudentCode()).ifPresent(existing -> {
                throw new IllegalArgumentException("Student code already exists: " + student.getStudentCode());
            });
        }
        student.setStatus("ACTIVE");
        student.setCreatedAt(LocalDateTime.now());
        log.info("Creating student: {} ({})", student.getFullname(), student.getStudentCode());
        return studentRepository.save(student);
    }

    @Transactional
    @CacheEvict(value = "students", allEntries = true)
    public List<Student> createBulk(List<Student> students) {
        students.forEach(s -> {
            s.setStatus("ACTIVE");
            s.setCreatedAt(LocalDateTime.now());
        });
        log.info("Bulk creating {} students", students.size());
        return studentRepository.saveAll(students);
    }

    @Transactional
    @CacheEvict(value = "students", allEntries = true)
    public Optional<Student> update(UUID id, Student details) {
        return studentRepository.findById(id).map(existing -> {
            if (details.getFullname() != null) existing.setFullname(details.getFullname());
            if (details.getFullnameVi() != null) existing.setFullnameVi(details.getFullnameVi());
            if (details.getDateOfBirth() != null) existing.setDateOfBirth(details.getDateOfBirth());
            if (details.getGender() != null) existing.setGender(details.getGender());
            if (details.getEmail() != null) existing.setEmail(details.getEmail());
            if (details.getPhone() != null) existing.setPhone(details.getPhone());
            if (details.getAvatarUrl() != null) existing.setAvatarUrl(details.getAvatarUrl());
            if (details.getSchoolName() != null) existing.setSchoolName(details.getSchoolName());
            if (details.getGrade() != null) existing.setGrade(details.getGrade());
            if (details.getCenterId() != null) existing.setCenterId(details.getCenterId());
            if (details.getParentId() != null) existing.setParentId(details.getParentId());
            if (details.getParentName() != null) existing.setParentName(details.getParentName());
            existing.setUpdatedAt(LocalDateTime.now());
            return studentRepository.save(existing);
        });
    }

    @Transactional
    @CacheEvict(value = "students", allEntries = true)
    public Optional<Student> updateStatus(UUID id, String status) {
        return studentRepository.findById(id).map(student -> {
            student.setStatus(status);
            student.setUpdatedAt(LocalDateTime.now());
            log.info("Updated student {} status to {}", id, status);
            return studentRepository.save(student);
        });
    }

    @Transactional
    @CacheEvict(value = "students", allEntries = true)
    public boolean delete(UUID id) {
        if (studentRepository.existsById(id)) {
            studentRepository.deleteById(id);
            log.info("Deleted student: {}", id);
            return true;
        }
        return false;
    }
}
