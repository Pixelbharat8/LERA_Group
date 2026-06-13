package com.lera.payroll_service.service;

import com.lera.payroll_service.entity.TeacherSalary;
import com.lera.payroll_service.repository.TeacherSalaryRepository;
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
public class TeacherSalaryService {

    private final TeacherSalaryRepository teacherSalaryRepository;

    public Page<TeacherSalary> getAll(Pageable pageable) {
        return teacherSalaryRepository.findAll(pageable);
    }

    public Optional<TeacherSalary> getById(UUID id) {
        return teacherSalaryRepository.findById(id);
    }

    public List<TeacherSalary> getAll() {
        return teacherSalaryRepository.findAll();
    }

    @Transactional
    public TeacherSalary create(TeacherSalary salary) {
        log.info("Creating teacher salary record");
        return teacherSalaryRepository.save(salary);
    }

    @Transactional
    public Optional<TeacherSalary> update(UUID id, TeacherSalary details) {
        return teacherSalaryRepository.findById(id).map(existing -> {
            details.setId(id);
            return teacherSalaryRepository.save(details);
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (teacherSalaryRepository.existsById(id)) {
            teacherSalaryRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
