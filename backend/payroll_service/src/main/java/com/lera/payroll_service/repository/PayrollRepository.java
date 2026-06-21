package com.lera.payroll_service.repository;

import com.lera.payroll_service.entity.PayrollRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayrollRepository extends JpaRepository<PayrollRecord, UUID> {
    
    List<PayrollRecord> findByTeacherIdOrderByPayPeriodStartDesc(UUID teacherId);

    List<PayrollRecord> findByCenterIdOrderByPayPeriodStartDesc(UUID centerId);
    
    List<PayrollRecord> findByStatusOrderByCreatedAtDesc(String status);
    
    List<PayrollRecord> findByPayPeriodStartAndPayPeriodEnd(LocalDate start, LocalDate end);

    /** Idempotent generation: one record per teacher per pay period. */
    Optional<PayrollRecord> findByTeacherIdAndPayPeriodStartAndPayPeriodEnd(UUID teacherId, LocalDate start, LocalDate end);
    
    @Query("SELECT COALESCE(SUM(p.totalAmount), 0) FROM PayrollRecord p WHERE p.status = 'PAID'")
    BigDecimal getTotalPayroll();
    
    @Query("SELECT COUNT(p) FROM PayrollRecord p WHERE p.status = :status")
    long countByStatus(String status);
    
    List<PayrollRecord> findAllByOrderByCreatedAtDesc();

    /**
     * FK-safe seeding support: pull teacher IDs from teacher service schema.
     * Table name is 'teachers' with PK 'id' (UUID).
     */
    @Query(value = "SELECT id FROM teachers LIMIT 50", nativeQuery = true)
    List<UUID> findExistingTeacherIds();
}
