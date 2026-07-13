package com.lera.payment_service.repository;

import com.lera.payment_service.entity.LedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, UUID> {
    List<LedgerEntry> findByTransactionDateBetween(LocalDate startDate, LocalDate endDate);
    List<LedgerEntry> findByEntryType(String entryType);
    List<LedgerEntry> findByStatus(String status);
    List<LedgerEntry> findByCenterId(UUID centerId);

    @Query("SELECT COALESCE(SUM(e.creditAmount), 0) FROM LedgerEntry e WHERE e.status = 'POSTED'")
    BigDecimal getTotalCredits();

    @Query("SELECT COALESCE(SUM(e.debitAmount), 0) FROM LedgerEntry e WHERE e.status = 'POSTED'")
    BigDecimal getTotalDebits();

    // ── Centre-scoped variants (finance dashboard for a centre-bound user) ──
    @Query("SELECT COALESCE(SUM(e.creditAmount), 0) FROM LedgerEntry e "
            + "WHERE e.status = 'POSTED' AND e.centerId = :centerId")
    BigDecimal getTotalCreditsByCenter(@Param("centerId") UUID centerId);

    @Query("SELECT COALESCE(SUM(e.debitAmount), 0) FROM LedgerEntry e "
            + "WHERE e.status = 'POSTED' AND e.centerId = :centerId")
    BigDecimal getTotalDebitsByCenter(@Param("centerId") UUID centerId);

    @Query("SELECT COALESCE(SUM(e.creditAmount), 0) FROM LedgerEntry e WHERE e.status = 'POSTED' AND e.transactionDate BETWEEN ?1 AND ?2")
    BigDecimal getTotalCreditsBetween(LocalDate startDate, LocalDate endDate);

    @Query("SELECT COALESCE(SUM(e.debitAmount), 0) FROM LedgerEntry e WHERE e.status = 'POSTED' AND e.transactionDate BETWEEN ?1 AND ?2")
    BigDecimal getTotalDebitsBetween(LocalDate startDate, LocalDate endDate);
}
