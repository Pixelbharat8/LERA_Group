package com.lera.academy_service.repository;

import com.lera.academy_service.entity.ScheduledReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ScheduledReportRepository extends JpaRepository<ScheduledReport, UUID> {

    List<ScheduledReport> findAllByOrderByCreatedAtDesc();

    /** Enabled reports whose next run is due. */
    List<ScheduledReport> findByEnabledTrueAndNextRunLessThanEqual(LocalDateTime now);
}
