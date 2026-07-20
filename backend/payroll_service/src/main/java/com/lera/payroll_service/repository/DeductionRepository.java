package com.lera.payroll_service.repository;

import com.lera.payroll_service.entity.Deduction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface DeductionRepository extends JpaRepository<Deduction, Long> {
    List<Deduction> findByTeacherId(UUID teacherId);
    List<Deduction> findByPayrollCycleId(Long payrollCycleId);
    List<Deduction> findByDeductionType(String deductionType);
    List<Deduction> findByStatus(String status);

    /** Total active (APPLIED/APPROVED) deduction for a teacher created within
     *  [start, end). Flows into the payslip for the period that contains it. */
    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM Deduction d WHERE d.teacherId = :teacherId " +
           "AND UPPER(d.status) IN ('APPLIED', 'APPROVED') AND d.createdAt >= :start AND d.createdAt < :end")
    BigDecimal sumActiveForTeacherInRange(@Param("teacherId") UUID teacherId,
            @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
