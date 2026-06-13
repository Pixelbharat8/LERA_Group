package com.lera.academy_service.repository;

import com.lera.academy_service.entity.TrainingSession;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface TrainingSessionRepository extends JpaRepository<TrainingSession, UUID> {

    List<TrainingSession> findAllByOrderByScheduledAtDesc();

    List<TrainingSession> findByStatusOrderByScheduledAtDesc(String status);

    List<TrainingSession> findByCenterIdOrderByScheduledAtDesc(UUID centerId);

    List<TrainingSession> findByCenterIdAndStatusOrderByScheduledAtDesc(UUID centerId, String status);

    List<TrainingSession> findByScheduledAtGreaterThanEqualAndStatusOrderByScheduledAtAsc(
            LocalDateTime from, String status, Pageable pageable);
}
