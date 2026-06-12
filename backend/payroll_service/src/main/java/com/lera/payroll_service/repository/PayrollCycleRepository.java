package com.lera.payroll_service.repository;

import com.lera.payroll_service.entity.PayrollCycle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayrollCycleRepository extends JpaRepository<PayrollCycle, UUID> {
    List<PayrollCycle> findByStatus(String status);
    List<PayrollCycle> findByStartDateBetween(LocalDate start, LocalDate end);
    Optional<PayrollCycle> findByCycleName(String cycleName);
    List<PayrollCycle> findByStartDateLessThanEqualAndEndDateGreaterThanEqual(LocalDate start, LocalDate end);
}
