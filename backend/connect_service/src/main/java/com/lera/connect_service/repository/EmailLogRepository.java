package com.lera.connect_service.repository;

import com.lera.connect_service.entity.EmailLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface EmailLogRepository extends JpaRepository<EmailLog, UUID> {
    List<EmailLog> findByLeadId(UUID leadId);
    List<EmailLog> findByUserId(UUID userId);
    List<EmailLog> findByEmailStatus(String emailStatus);
    List<EmailLog> findByLeadIdOrderBySentAtDesc(UUID leadId);
    List<EmailLog> findBySentAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT e FROM EmailLog e WHERE e.leadId IN "
            + "(SELECT l.id FROM Lead l WHERE l.centerId = :centerId) ORDER BY e.sentAt DESC")
    List<EmailLog> findByLeadCenterId(@Param("centerId") UUID centerId);
}
