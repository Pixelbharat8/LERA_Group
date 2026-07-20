package com.lera.payroll_service.repository;

import com.lera.payroll_service.entity.Bonus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface BonusRepository extends JpaRepository<Bonus, Long> {
    List<Bonus> findByTeacherId(UUID teacherId);
    List<Bonus> findByPayrollCycleId(Long payrollCycleId);
    List<Bonus> findByBonusType(String bonusType);
    List<Bonus> findByStatus(String status);

    /** Total APPROVED bonus for a teacher created within [start, end). Used by
     *  payroll generation so approved bonuses flow into the payslip for the
     *  period that contains them (paid exactly once per non-overlapping period). */
    @Query("SELECT COALESCE(SUM(b.amount), 0) FROM Bonus b WHERE b.teacherId = :teacherId " +
           "AND UPPER(b.status) = 'APPROVED' AND b.createdAt >= :start AND b.createdAt < :end")
    BigDecimal sumApprovedForTeacherInRange(@Param("teacherId") UUID teacherId,
            @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
