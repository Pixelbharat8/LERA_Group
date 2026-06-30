package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A report the system generates on a schedule and emails to recipients.
 * ddl-auto manages this table (consistent with the other academy entities).
 */
@Entity
@Table(name = "scheduled_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduledReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "report_type", nullable = false)
    private String reportType; // SUMMARY, STUDENTS, TEACHERS, ENROLLMENTS

    @Column(nullable = false)
    private String frequency;  // DAILY, WEEKLY, MONTHLY

    @Column(columnDefinition = "TEXT")
    private String recipients; // comma-separated email addresses

    @Column(name = "center_id")
    private UUID centerId;     // optional centre scope

    @Column(name = "next_run")
    private LocalDateTime nextRun;

    @Column(name = "last_run")
    private LocalDateTime lastRun;

    @Builder.Default
    @Column(nullable = false)
    private Boolean enabled = true;

    @Column(name = "created_by")
    private String createdBy;

    @Builder.Default
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
