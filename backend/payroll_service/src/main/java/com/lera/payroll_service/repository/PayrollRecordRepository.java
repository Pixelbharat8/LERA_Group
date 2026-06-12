package com.lera.payroll_service.repository;

import com.lera.payroll_service.entity.PayrollRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PayrollRecordRepository extends JpaRepository<PayrollRecord, UUID> {
    List<PayrollRecord> findByTeacherId(UUID teacherId);
    List<PayrollRecord> findByStatus(String status);
    List<PayrollRecord> findByCenterId(UUID centerId);
}