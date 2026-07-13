package com.lera.payment_service.repository;

import com.lera.payment_service.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    
    List<Payment> findByInvoiceId(UUID invoiceId);
    
    List<Payment> findByStatus(String status);
    
    List<Payment> findByCenterId(UUID centerId);
    
    List<Payment> findByStudentId(UUID studentId);
    
    List<Payment> findByInvoiceIdOrderByCreatedAtDesc(UUID invoiceId);
    
    List<Payment> findByStatusOrderByCreatedAtDesc(String status);
    
    List<Payment> findByPaymentMethodOrderByCreatedAtDesc(String paymentMethod);
    
    List<Payment> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    List<Payment> findByProcessedBy(UUID processedBy);
    
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'COMPLETED'")
    BigDecimal getTotalRevenue();

    /** Completed revenue recorded on/after a cutoff (used for the real "this month" figure). */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'COMPLETED' AND p.createdAt >= :start")
    BigDecimal sumCompletedSince(java.time.LocalDateTime start);

    /** Centre-scoped equivalent of sumCompletedSince (finance dashboard for a centre-bound user). */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p "
            + "WHERE p.status = 'COMPLETED' AND p.centerId = :centerId AND p.createdAt >= :start")
    BigDecimal sumCompletedByCenterSince(@Param("centerId") UUID centerId,
                                         @Param("start") java.time.LocalDateTime start);

    /** Completed revenue within a half-open window [start, end) — backs period revenue + growth. */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'COMPLETED' AND p.createdAt >= :start AND p.createdAt < :end")
    BigDecimal sumCompletedBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /** Center-scoped completed revenue within [start, end). */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'COMPLETED' AND p.centerId = :centerId AND p.createdAt >= :start AND p.createdAt < :end")
    BigDecimal sumCompletedByCenterBetween(@Param("centerId") UUID centerId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = :status")
    BigDecimal sumAmountByStatus(String status);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = :status")
    long countByStatus(String status);

    // Center-scoped aggregates — let the DB do the work instead of loading all payments.
    long countByCenterId(UUID centerId);
    long countByCenterIdAndStatus(UUID centerId, String status);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.centerId = :centerId AND p.status = :status")
    BigDecimal sumAmountByCenterAndStatus(UUID centerId, String status);

    /** Completed revenue grouped by calendar month (YYYY-MM) since a cutoff — for the trend chart. */
    @Query(value = "SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS ym, COALESCE(SUM(amount), 0) AS rev "
            + "FROM payments WHERE status = 'COMPLETED' AND created_at >= :start "
            + "GROUP BY 1 ORDER BY 1", nativeQuery = true)
    List<Object[]> monthlyRevenueSince(@Param("start") LocalDateTime start);

    @Query(value = "SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS ym, COALESCE(SUM(amount), 0) AS rev "
            + "FROM payments WHERE status = 'COMPLETED' AND center_id = :centerId AND created_at >= :start "
            + "GROUP BY 1 ORDER BY 1", nativeQuery = true)
    List<Object[]> monthlyRevenueByCenterSince(@Param("centerId") UUID centerId, @Param("start") LocalDateTime start);

    List<Payment> findAllByOrderByCreatedAtDesc();
}
