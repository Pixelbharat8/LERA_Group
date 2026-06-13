package com.lera.payroll_service.service;

import com.lera.payroll_service.entity.SalaryComponent;
import com.lera.payroll_service.repository.SalaryComponentRepository;
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
public class SalaryComponentService {

    private final SalaryComponentRepository salaryComponentRepository;

    public Page<SalaryComponent> getAll(Pageable pageable) {
        return salaryComponentRepository.findAll(pageable);
    }

    public Optional<SalaryComponent> getById(UUID id) {
        return salaryComponentRepository.findById(id);
    }

    public List<SalaryComponent> getAll() {
        return salaryComponentRepository.findAll();
    }

    public List<SalaryComponent> getByType(String type) {
        return salaryComponentRepository.findByComponentType(type);
    }

    public List<SalaryComponent> getActive() {
        return salaryComponentRepository.findByIsActive(true);
    }

    @Transactional
    public Optional<SalaryComponent> toggleActive(UUID id) {
        return salaryComponentRepository.findById(id).map(component -> {
            component.setIsActive(!component.getIsActive());
            return salaryComponentRepository.save(component);
        });
    }

    @Transactional
    public SalaryComponent create(SalaryComponent component) {
        log.info("Creating salary component: {}", component.getComponentName());
        return salaryComponentRepository.save(component);
    }

    @Transactional
    public Optional<SalaryComponent> update(UUID id, SalaryComponent details) {
        return salaryComponentRepository.findById(id).map(existing -> {
            details.setId(id);
            return salaryComponentRepository.save(details);
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (salaryComponentRepository.existsById(id)) {
            salaryComponentRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
