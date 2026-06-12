package com.lera.payroll_service.service;

import com.lera.payroll_service.entity.Deduction;
import com.lera.payroll_service.repository.DeductionRepository;
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
public class DeductionService {

    private final DeductionRepository deductionRepository;

    public Page<Deduction> getAll(Pageable pageable) {
        return deductionRepository.findAll(pageable);
    }

    public Optional<Deduction> getById(Long id) {
        return deductionRepository.findById(id);
    }

    public List<Deduction> getAll() {
        return deductionRepository.findAll();
    }

    public List<Deduction> getByTeacher(Long teacherId) {
        return deductionRepository.findByTeacherId(teacherId);
    }

    @Transactional
    public Deduction create(Deduction deduction) {
        log.info("Creating deduction");
        return deductionRepository.save(deduction);
    }

    @Transactional
    public Optional<Deduction> update(Long id, Deduction details) {
        return deductionRepository.findById(id).map(existing -> {
            details.setId(id);
            return deductionRepository.save(details);
        });
    }

    @Transactional
    public boolean delete(Long id) {
        if (deductionRepository.existsById(id)) {
            deductionRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
