package com.lera.connect_service.repository;

import com.lera.connect_service.entity.LeadNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface LeadNoteRepository extends JpaRepository<LeadNote, UUID> {
    List<LeadNote> findByLeadId(UUID leadId);
    List<LeadNote> findByCreatedBy(UUID createdBy);
    List<LeadNote> findByLeadIdOrderByCreatedAtDesc(UUID leadId);
    List<LeadNote> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT n FROM LeadNote n WHERE n.leadId IN "
            + "(SELECT l.id FROM Lead l WHERE l.centerId = :centerId) ORDER BY n.createdAt DESC")
    List<LeadNote> findByLeadCenterId(@Param("centerId") UUID centerId);
}
