package com.lera.academy_service.repository;

import com.lera.academy_service.entity.TrainingRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TrainingRegistrationRepository extends JpaRepository<TrainingRegistration, UUID> {

    List<TrainingRegistration> findBySessionIdOrderByRegisteredAtAsc(UUID sessionId);

    List<TrainingRegistration> findByUserIdOrderByRegisteredAtDesc(UUID userId);

    boolean existsBySessionIdAndUserId(UUID sessionId, UUID userId);

    long countBySessionId(UUID sessionId);
}
