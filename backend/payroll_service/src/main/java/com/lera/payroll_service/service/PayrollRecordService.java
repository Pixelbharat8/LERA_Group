package com.lera.payroll_service.service;

import com.lera.payroll_service.entity.PayrollRecord;
import com.lera.payroll_service.repository.PayrollRecordRepository;
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
public class PayrollRecordService {

    private final PayrollRecordRepository payrollRecordRepository;

    public List<PayrollRecord> getAll() {
        return payrollRecordRepository.findAll();
    }

    public Page<PayrollRecord> getAll(Pageable pageable) {
        return payrollRecordRepository.findAll(pageable);
    }

    public Optional<PayrollRecord> getById(UUID id) {
        return payrollRecordRepository.findById(id);
    }

    public List<PayrollRecord> getByCenter(UUID centerId) {
        return payrollRecordRepository.findByCenterId(centerId);
    }

    public List<PayrollRecord> getByTeacher(UUID teacherId) {
        return payrollRecordRepository.findByTeacherId(teacherId);
    }

    public List<PayrollRecord> getByStatus(String status) {
        return payrollRecordRepository.findByStatus(status);
    }

    @Transactional
    public PayrollRecord create(PayrollRecord record) {
        log.info("Creating payroll record for teacher: {}", record.getTeacherId());
        return payrollRecordRepository.save(record);
    }

    @Transactional
    public Optional<PayrollRecord> update(UUID id, PayrollRecord details) {
        return payrollRecordRepository.findById(id).map(existing -> {
            if (details.getStatus() != null) existing.setStatus(details.getStatus());
            if (details.getBaseSalary() != null) existing.setBaseSalary(details.getBaseSalary());
            if (details.getTotalAmount() != null) existing.setTotalAmount(details.getTotalAmount());
            if (details.getBonus() != null) existing.setBonus(details.getBonus());
            if (details.getDeductions() != null) existing.setDeductions(details.getDeductions());
            return payrollRecordRepository.save(existing);
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (payrollRecordRepository.existsById(id)) {
            payrollRecordRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
