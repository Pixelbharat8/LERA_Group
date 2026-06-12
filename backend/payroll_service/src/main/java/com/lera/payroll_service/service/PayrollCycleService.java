package com.lera.payroll_service.service;

import com.lera.payroll_service.entity.PayrollCycle;
import com.lera.payroll_service.repository.PayrollCycleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PayrollCycleService {

    private final PayrollCycleRepository payrollCycleRepository;

    public List<PayrollCycle> getAll() {
        return payrollCycleRepository.findAll();
    }

    public Optional<PayrollCycle> getById(UUID id) {
        return payrollCycleRepository.findById(id);
    }

    public List<PayrollCycle> getByStatus(String status) {
        return payrollCycleRepository.findByStatus(status);
    }

    public Optional<PayrollCycle> getByName(String name) {
        return payrollCycleRepository.findByCycleName(name);
    }

    public List<PayrollCycle> getByDateRange(LocalDate start, LocalDate end) {
        return payrollCycleRepository.findByStartDateBetween(start, end);
    }

    public List<PayrollCycle> getCurrent() {
        LocalDate today = LocalDate.now();
        return payrollCycleRepository.findByStartDateLessThanEqualAndEndDateGreaterThanEqual(today, today);
    }

    @Transactional
    public PayrollCycle create(PayrollCycle cycle) {
        log.info("Creating payroll cycle: {}", cycle.getCycleName());
        return payrollCycleRepository.save(cycle);
    }

    @Transactional
    public Optional<PayrollCycle> update(UUID id, PayrollCycle details) {
        return payrollCycleRepository.findById(id).map(cycle -> {
            if (details.getCycleName() != null) cycle.setCycleName(details.getCycleName());
            if (details.getCycleType() != null) cycle.setCycleType(details.getCycleType());
            if (details.getStartDate() != null) cycle.setStartDate(details.getStartDate());
            if (details.getEndDate() != null) cycle.setEndDate(details.getEndDate());
            if (details.getPaymentDate() != null) cycle.setPaymentDate(details.getPaymentDate());
            if (details.getStatus() != null) cycle.setStatus(details.getStatus());
            if (details.getTotalEmployees() != null) cycle.setTotalEmployees(details.getTotalEmployees());
            if (details.getTotalGrossSalary() != null) cycle.setTotalGrossSalary(details.getTotalGrossSalary());
            if (details.getTotalDeductions() != null) cycle.setTotalDeductions(details.getTotalDeductions());
            if (details.getTotalNetSalary() != null) cycle.setTotalNetSalary(details.getTotalNetSalary());
            return payrollCycleRepository.save(cycle);
        });
    }

    @Transactional
    public Optional<PayrollCycle> updateStatus(UUID id, String status) {
        return payrollCycleRepository.findById(id).map(cycle -> {
            cycle.setStatus(status);
            return payrollCycleRepository.save(cycle);
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (payrollCycleRepository.existsById(id)) {
            payrollCycleRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
