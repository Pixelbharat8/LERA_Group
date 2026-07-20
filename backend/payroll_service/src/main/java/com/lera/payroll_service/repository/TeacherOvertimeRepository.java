package com.lera.payroll_service.repository;

import com.lera.payroll_service.entity.TeacherOvertime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface TeacherOvertimeRepository extends JpaRepository<TeacherOvertime, UUID> {
    List<TeacherOvertime> findByTeacherId(UUID teacherId);
    List<TeacherOvertime> findByStatus(String status);
    List<TeacherOvertime> findByOvertimeDateBetween(LocalDate start, LocalDate end);

    /** Total APPROVED overtime pay for a teacher on dates within [start, end]
     *  (inclusive). Flows into the payslip for the period that contains it. */
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM TeacherOvertime o WHERE o.teacherId = :teacherId " +
           "AND UPPER(o.status) = 'APPROVED' AND o.overtimeDate >= :start AND o.overtimeDate <= :end")
    BigDecimal sumApprovedForTeacherInRange(@Param("teacherId") UUID teacherId,
            @Param("start") LocalDate start, @Param("end") LocalDate end);
}
