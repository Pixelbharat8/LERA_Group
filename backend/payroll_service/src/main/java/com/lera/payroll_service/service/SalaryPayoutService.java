package com.lera.payroll_service.service;

import com.lera.payroll_service.entity.SalaryPayout;
import com.lera.payroll_service.repository.SalaryPayoutRepository;
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
public class SalaryPayoutService {

    private final SalaryPayoutRepository salaryPayoutRepository;

    public Page<SalaryPayout> getAll(Pageable pageable) {
        return salaryPayoutRepository.findAll(pageable);
    }

    public Optional<SalaryPayout> getById(UUID id) {
        return salaryPayoutRepository.findById(id);
    }

    public List<SalaryPayout> getAll() {
        return salaryPayoutRepository.findAll();
    }

    public List<SalaryPayout> getByTeacher(UUID teacherId) {
        return salaryPayoutRepository.findByTeacherId(teacherId);
    }

    public List<SalaryPayout> getBySalary(UUID salaryId) {
        return salaryPayoutRepository.findBySalaryId(salaryId);
    }

    public List<SalaryPayout> getByStatus(String status) {
        return salaryPayoutRepository.findByStatus(status);
    }

    public List<SalaryPayout> getByDateRange(java.time.LocalDate start, java.time.LocalDate end) {
        return salaryPayoutRepository.findByPayoutDateBetween(start, end);
    }

    @Transactional
    public Optional<SalaryPayout> updateStatus(UUID id, String status) {
        return salaryPayoutRepository.findById(id).map(payout -> {
            payout.setStatus(status);
            return salaryPayoutRepository.save(payout);
        });
    }

    @Transactional
    public SalaryPayout create(SalaryPayout payout) {
        log.info("Creating salary payout");
        return salaryPayoutRepository.save(payout);
    }

    @Transactional
    public Optional<SalaryPayout> update(UUID id, SalaryPayout details) {
        return salaryPayoutRepository.findById(id).map(existing -> {
            details.setId(id);
            return salaryPayoutRepository.save(details);
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (salaryPayoutRepository.existsById(id)) {
            salaryPayoutRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
