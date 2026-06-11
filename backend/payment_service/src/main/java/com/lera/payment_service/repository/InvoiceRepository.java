package com.lera.payment_service.repository;

import com.lera.payment_service.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    List<Invoice> findByStudentId(UUID studentId);
    List<Invoice> findByCenterId(UUID centerId);
    List<Invoice> findByStatus(String status);

    /** Invoices in a given status whose due date is strictly before the cutoff (for overdue sweeps). */
    List<Invoice> findByStatusAndDueDateBefore(String status, LocalDate cutoff);

    /** Unpaid invoices due on/before the cutoff that haven't been reminded since {@code since} (today). */
    @Query("SELECT i FROM Invoice i WHERE i.status IN ('PENDING','OVERDUE') "
         + "AND i.dueDate IS NOT NULL AND i.dueDate <= :cutoff "
         + "AND (i.lastReminderAt IS NULL OR i.lastReminderAt < :since)")
    List<Invoice> findRemindable(@Param("cutoff") LocalDate cutoff, @Param("since") LocalDateTime since);

    /**
     * Parent portal: same Postgres DB as academy — join students by parent_id.
     */
    @Query(value = "SELECT i.* FROM invoices i "
            + "INNER JOIN students s ON i.student_id = s.id "
            + "WHERE s.parent_id = :parentId "
            + "ORDER BY i.created_at DESC NULLS LAST",
            nativeQuery = true)
    List<Invoice> findByParentIdJoinStudents(@Param("parentId") UUID parentId);
}
