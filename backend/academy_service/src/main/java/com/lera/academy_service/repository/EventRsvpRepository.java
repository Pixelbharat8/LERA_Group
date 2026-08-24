package com.lera.academy_service.repository;

import com.lera.academy_service.entity.EventRsvp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventRsvpRepository extends JpaRepository<EventRsvp, UUID> {
    Optional<EventRsvp> findByEventIdAndUserId(UUID eventId, UUID userId);
    List<EventRsvp> findByUserId(UUID userId);
    List<EventRsvp> findByEventId(UUID eventId);
}
