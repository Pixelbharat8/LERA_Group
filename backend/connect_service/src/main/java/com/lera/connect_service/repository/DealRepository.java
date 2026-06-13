package com.lera.connect_service.repository;

import com.lera.connect_service.entity.Deal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DealRepository extends JpaRepository<Deal, UUID> {
    List<Deal> findByLeadId(UUID leadId);
    List<Deal> findByCenterId(UUID centerId);
    List<Deal> findByCenterIdAndStage(UUID centerId, String stage);
    List<Deal> findByStage(String stage);
    List<Deal> findByAssignedTo(UUID assignedTo);
    List<Deal> findByOrderByCreatedAtDesc();
}
