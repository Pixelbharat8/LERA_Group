package com.lera.payroll_service.repository;

import com.lera.payroll_service.entity.Bonus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BonusRepository extends JpaRepository<Bonus, Long> {
    List<Bonus> findByTeacherId(Long teacherId);
    List<Bonus> findByPayrollCycleId(Long payrollCycleId);
    List<Bonus> findByBonusType(String bonusType);
    List<Bonus> findByStatus(String status);
}
