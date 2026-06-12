package com.lera.connect_service.repository;

import com.lera.connect_service.entity.LeadAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeadAssignmentRepository extends JpaRepository<LeadAssignment, UUID> {
    List<LeadAssignment> findByLeadId(UUID leadId);
    List<LeadAssignment> findByAssignedTo(UUID assignedTo);
    List<LeadAssignment> findByAssignedBy(UUID assignedBy);
    Optional<LeadAssignment> findByLeadIdAndAssignedTo(UUID leadId, UUID assignedTo);
    List<LeadAssignment> findByIsActive(Boolean isActive);
    List<LeadAssignment> findByAssignmentType(String assignmentType);

    @Query("SELECT a FROM LeadAssignment a WHERE a.leadId IN "
            + "(SELECT l.id FROM Lead l WHERE l.centerId = :centerId)")
    List<LeadAssignment> findByLeadCenterId(@Param("centerId") UUID centerId);
}
