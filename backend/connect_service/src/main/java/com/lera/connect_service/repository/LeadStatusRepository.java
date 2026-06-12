package com.lera.connect_service.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lera.connect_service.entity.LeadStatus;

@Repository
public interface LeadStatusRepository extends JpaRepository<LeadStatus, UUID> {
    Optional<LeadStatus> findByStatusName(String statusName);
    Optional<LeadStatus> findByStatusCode(String statusCode);

    List<LeadStatus> findByIsActive(Boolean isActive);

    List<LeadStatus> findByDisplayOrderLessThan(Integer displayOrder);
    Optional<LeadStatus> findByDisplayOrder(Integer displayOrder);
}
