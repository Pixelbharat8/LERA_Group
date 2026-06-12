package com.lera.payroll_service.repository;

import com.lera.payroll_service.entity.SalaryPayout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface SalaryPayoutRepository extends JpaRepository<SalaryPayout, UUID> {
    List<SalaryPayout> findByTeacherId(UUID teacherId);
    List<SalaryPayout> findBySalaryId(UUID salaryId);
    List<SalaryPayout> findByStatus(String status);
    List<SalaryPayout> findByPayoutDateBetween(LocalDate start, LocalDate end);
}
