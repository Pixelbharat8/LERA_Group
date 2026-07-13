package com.lera.payment_service.repository;

import com.lera.payment_service.entity.Refund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface RefundRepository extends JpaRepository<Refund, UUID> {
    List<Refund> findByPaymentId(UUID paymentId);
    List<Refund> findByStatus(String status);

    /** DB-side sum of approved refunds (was summed in memory over every refund row). */
    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM Refund r WHERE UPPER(r.status) = 'APPROVED'")
    BigDecimal sumApproved();

    /**
     * Approved refunds for one centre. Refunds carry no centre of their own, so they are
     * attributed through the payment they refund (payments do carry centerId).
     */
    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM Refund r WHERE UPPER(r.status) = 'APPROVED' "
            + "AND r.paymentId IN (SELECT p.id FROM Payment p WHERE p.centerId = :centerId)")
    BigDecimal sumApprovedByCenter(@Param("centerId") UUID centerId);
}
