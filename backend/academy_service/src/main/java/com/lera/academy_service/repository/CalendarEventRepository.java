package com.lera.academy_service.repository;

import com.lera.academy_service.entity.CalendarEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, UUID> {

    List<CalendarEvent> findByStartDateBetweenOrderByStartDateAsc(LocalDateTime from, LocalDateTime to);

    List<CalendarEvent> findByStartDateBetweenAndCenterIdOrderByStartDateAsc(
            LocalDateTime from, LocalDateTime to, UUID centerId);

    List<CalendarEvent> findByStartDateGreaterThanEqualOrderByStartDateAsc(LocalDateTime from, Pageable pageable);
}
