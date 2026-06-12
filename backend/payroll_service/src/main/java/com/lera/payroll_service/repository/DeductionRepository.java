package com.lera.payroll_service.repository;

import com.lera.payroll_service.entity.Deduction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeductionRepository extends JpaRepository<Deduction, Long> {
    List<Deduction> findByTeacherId(Long teacherId);
    List<Deduction> findByPayrollCycleId(Long payrollCycleId);
    List<Deduction> findByDeductionType(String deductionType);
    List<Deduction> findByStatus(String status);
}
