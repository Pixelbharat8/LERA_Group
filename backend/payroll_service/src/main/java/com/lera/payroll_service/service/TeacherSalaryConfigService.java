package com.lera.payroll_service.service;

import com.lera.payroll_service.dto.TeacherSalaryConfigRequest;
import com.lera.payroll_service.entity.TeacherSalaryConfig;
import com.lera.payroll_service.repository.TeacherSalaryConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TeacherSalaryConfigService {

    private final TeacherSalaryConfigRepository salaryConfigRepository;

    public List<TeacherSalaryConfig> getAll() {
        return salaryConfigRepository.findAll();
    }

    public Optional<TeacherSalaryConfig> getById(UUID id) {
        return salaryConfigRepository.findById(id);
    }

    public Optional<TeacherSalaryConfig> getByTeacherId(UUID teacherId) {
        return salaryConfigRepository.findByTeacherId(teacherId);
    }

    @Transactional
    public TeacherSalaryConfig create(TeacherSalaryConfigRequest request) {
        if (request.getTeacherId() == null) {
            throw new IllegalArgumentException("teacherId is required");
        }
        UUID teacherId = request.getTeacherId();

        if (salaryConfigRepository.findByTeacherId(teacherId).isPresent()) {
            throw new IllegalStateException("Salary config already exists for this teacher. Use PUT to update.");
        }

        TeacherSalaryConfig config = new TeacherSalaryConfig();
        config.setTeacherId(teacherId);
        config.setBaseSalary(request.getBaseSalary() != null ? request.getBaseSalary() : BigDecimal.ZERO);
        config.setHourlyRate(request.getHourlyRate() != null ? request.getHourlyRate() : new BigDecimal("200000"));
        config.setSalaryType(request.getSalaryType() != null ? request.getSalaryType() : "HOURLY");
        config.setEffectiveFrom(LocalDateTime.now());
        config.setStatus("ACTIVE");

        if (request.getCenterId() != null) {
            config.setCenterId(request.getCenterId());
        }

        log.info("Creating salary config for teacher: {}", teacherId);
        return salaryConfigRepository.save(config);
    }

    @Transactional
    public TeacherSalaryConfig upsertByTeacherId(UUID teacherId, TeacherSalaryConfigRequest request) {
        return salaryConfigRepository.findByTeacherId(teacherId).map(config -> {
            if (request.getBaseSalary() != null)
                config.setBaseSalary(request.getBaseSalary());
            if (request.getHourlyRate() != null)
                config.setHourlyRate(request.getHourlyRate());
            if (request.getSessionRate() != null)
                config.setSessionRate(request.getSessionRate());
            if (request.getSalaryType() != null)
                config.setSalaryType(request.getSalaryType());
            if (request.getStatus() != null)
                config.setStatus(request.getStatus());
            return salaryConfigRepository.save(config);
        }).orElseGet(() -> {
            TeacherSalaryConfig config = new TeacherSalaryConfig();
            config.setTeacherId(teacherId);
            config.setBaseSalary(request.getBaseSalary() != null ? request.getBaseSalary() : BigDecimal.ZERO);
            config.setHourlyRate(request.getHourlyRate() != null ? request.getHourlyRate() : new BigDecimal("200000"));
            config.setSalaryType("HOURLY");
            config.setEffectiveFrom(LocalDateTime.now());
            config.setStatus("ACTIVE");
            return salaryConfigRepository.save(config);
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (salaryConfigRepository.existsById(id)) {
            salaryConfigRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
