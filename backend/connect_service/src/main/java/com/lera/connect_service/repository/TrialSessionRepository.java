package com.lera.connect_service.repository;

import com.lera.connect_service.entity.TrialSession;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface TrialSessionRepository extends JpaRepository<TrialSession, UUID> {

    List<TrialSession> findByLeadIdOrderByScheduledAtDesc(UUID leadId);

    List<TrialSession> findByCenterIdOrderByScheduledAtDesc(UUID centerId);

    List<TrialSession> findByCenterIdAndStatusOrderByScheduledAtDesc(UUID centerId, String status);

    List<TrialSession> findByStatusOrderByScheduledAtDesc(String status);

    List<TrialSession> findAllByOrderByScheduledAtDesc();

    List<TrialSession> findByScheduledAtGreaterThanEqualAndStatusOrderByScheduledAtAsc(
            LocalDateTime from, String status, Pageable pageable);

    List<TrialSession> findByCenterIdAndScheduledAtGreaterThanEqualAndStatusOrderByScheduledAtAsc(
            UUID centerId, LocalDateTime from, String status, Pageable pageable);
}
