package com.lera.payroll_service.service;

import com.lera.payroll_service.entity.PayrollRecord;
import com.lera.payroll_service.repository.PayrollRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PayrollService {

    private final PayrollRepository payrollRepository;

    public Page<PayrollRecord> getAll(Pageable pageable) {
        return payrollRepository.findAll(pageable);
    }

    @Cacheable(value = "payroll", key = "'all'")
    public List<PayrollRecord> getAll() {
        return payrollRepository.findAllByOrderByCreatedAtDesc();
    }

    @Cacheable(value = "payroll", key = "#id")
    public Optional<PayrollRecord> getById(UUID id) {
        return payrollRepository.findById(id);
    }

    @Cacheable(value = "payroll", key = "'teacher-' + #teacherId")
    public List<PayrollRecord> getByTeacher(UUID teacherId) {
        return payrollRepository.findByTeacherIdOrderByPayPeriodStartDesc(teacherId);
    }

    @Cacheable(value = "payroll", key = "'center-' + #centerId")
    public List<PayrollRecord> getByCenter(UUID centerId) {
        return payrollRepository.findByCenterIdOrderByPayPeriodStartDesc(centerId);
    }

    public List<PayrollRecord> getByTeacherAndYear(UUID teacherId, int year) {
        return payrollRepository.findByTeacherIdOrderByPayPeriodStartDesc(teacherId).stream()
                .filter(r -> r.getPayPeriodStart() != null && r.getPayPeriodStart().getYear() == year)
                .toList();
    }

    public List<PayrollRecord> getByStatus(String status) {
        return payrollRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPayroll", payrollRepository.getTotalPayroll());
        stats.put("pendingCount", payrollRepository.countByStatus("PENDING"));
        stats.put("approvedCount", payrollRepository.countByStatus("APPROVED"));
        stats.put("paidCount", payrollRepository.countByStatus("PAID"));
        return stats;
    }

    @CacheEvict(value = "payroll", allEntries = true)
    @Transactional
    public PayrollRecord create(PayrollRecord record) {
        log.info("Creating payroll record for teacher: {}", record.getTeacherId());
        return payrollRepository.save(record);
    }

    @CacheEvict(value = "payroll", allEntries = true)
    @Transactional
    public Optional<PayrollRecord> update(UUID id, PayrollRecord details) {
        return payrollRepository.findById(id).map(existing -> {
            details.setId(id);
            return payrollRepository.save(details);
        });
    }

    @CacheEvict(value = "payroll", allEntries = true)
    @Transactional
    public Optional<PayrollRecord> approve(UUID id, UUID approvedBy) {
        return payrollRepository.findById(id).map(payroll -> {
            payroll.setStatus("APPROVED");
            if (approvedBy != null) payroll.setApprovedBy(approvedBy);
            return payrollRepository.save(payroll);
        });
    }

    @CacheEvict(value = "payroll", allEntries = true)
    @Transactional
    public Optional<PayrollRecord> updateStatus(UUID id, String status) {
        return payrollRepository.findById(id).map(record -> {
            record.setStatus(status);
            return payrollRepository.save(record);
        });
    }

    @CacheEvict(value = "payroll", allEntries = true)
    @Transactional
    public boolean delete(UUID id) {
        if (payrollRepository.existsById(id)) {
            payrollRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
