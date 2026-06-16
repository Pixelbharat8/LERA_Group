package com.lera.payment_service.repository;

import com.lera.payment_service.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = :status")
    BigDecimal sumAmountByStatus(String status);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = :status")
    long countByStatus(String status);

    // Center-scoped aggregates — let the DB do the work instead of loading all payments.
    long countByCenterId(UUID centerId);
    long countByCenterIdAndStatus(UUID centerId, String status);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.centerId = :centerId AND p.status = :status")
    BigDecimal sumAmountByCenterAndStatus(UUID centerId, String status);

    List<Payment> findAllByOrderByCreatedAtDesc();
}
