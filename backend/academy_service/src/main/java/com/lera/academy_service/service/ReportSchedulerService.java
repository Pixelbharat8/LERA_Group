package com.lera.academy_service.service;

import com.lera.academy_service.entity.ScheduledReport;
import com.lera.academy_service.repository.ScheduledReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Runs due scheduled reports: generates the content and emails it to recipients, then advances
 * the next-run time by the report's frequency. Runs hourly (academy already @EnableScheduling).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReportSchedulerService {

    private final ScheduledReportRepository repository;
    private final ReportGenerationService generation;
    private final ReportEmailService email;

    @Scheduled(fixedRate = 3_600_000L) // hourly
    public void runDueReports() {
        List<ScheduledReport> due = repository.findByEnabledTrueAndNextRunLessThanEqual(LocalDateTime.now());
        if (due.isEmpty()) return;
        log.info("Running {} due scheduled report(s)", due.size());
        for (ScheduledReport r : due) {
            try {
                runOne(r);
            } catch (Exception e) {
                log.error("Scheduled report '{}' failed: {}", r.getName(), e.getMessage());
            }
        }
    }

    /** Generate + email a single report and advance its schedule. Also used by "run now". */
    public void runOne(ScheduledReport r) {
        ReportGenerationService.GeneratedReport report = generation.generate(r.getReportType(), r.getCenterId());
        email.sendReport(r.getRecipients(), r.getName(), report.summary(), report.csv());
        LocalDateTime now = LocalDateTime.now();
        r.setLastRun(now);
        r.setNextRun(nextRun(r.getFrequency(), now));
        repository.save(r);
    }

    public static LocalDateTime nextRun(String frequency, LocalDateTime from) {
        if (frequency == null) return from.plusDays(1);
        switch (frequency.trim().toUpperCase()) {
            case "WEEKLY":  return from.plusWeeks(1);
            case "MONTHLY": return from.plusMonths(1);
            case "DAILY":
            default:        return from.plusDays(1);
        }
    }
}
