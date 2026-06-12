package com.lera.payroll_service.service;

import com.lera.payroll_service.entity.TeacherOvertime;
import com.lera.payroll_service.repository.TeacherOvertimeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TeacherOvertimeService {

    private final TeacherOvertimeRepository teacherOvertimeRepository;

    public Page<TeacherOvertime> getAll(Pageable pageable) {
        return teacherOvertimeRepository.findAll(pageable);
    }

    public Optional<TeacherOvertime> getById(UUID id) {
        return teacherOvertimeRepository.findById(id);
    }

    public List<TeacherOvertime> getAll() {
        return teacherOvertimeRepository.findAll();
    }

    public List<TeacherOvertime> getByTeacher(UUID teacherId) {
        return teacherOvertimeRepository.findByTeacherId(teacherId);
    }

    public List<TeacherOvertime> getByStatus(String status) {
        return teacherOvertimeRepository.findByStatus(status);
    }

    public List<TeacherOvertime> getByDateRange(java.time.LocalDate start, java.time.LocalDate end) {
        return teacherOvertimeRepository.findByOvertimeDateBetween(start, end);
    }

    @Transactional
    public TeacherOvertime create(TeacherOvertime overtime) {
        log.info("Creating teacher overtime record");
        return teacherOvertimeRepository.save(overtime);
    }

    @Transactional
    public Optional<TeacherOvertime> update(UUID id, TeacherOvertime details) {
        return teacherOvertimeRepository.findById(id).map(existing -> {
            details.setId(id);
            return teacherOvertimeRepository.save(details);
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (teacherOvertimeRepository.existsById(id)) {
            teacherOvertimeRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
