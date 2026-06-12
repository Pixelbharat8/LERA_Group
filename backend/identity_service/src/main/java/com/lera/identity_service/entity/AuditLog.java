package com.lera.identity_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Audit-log entry. The {@code audit_logs} table has shipped in
 * {@code database/init/init.sql} since the original schema, but there was no
 * JPA mapping or controller around it. This entity lets us list / filter
 * existing entries through {@code GET /api/audit-logs} so the audit page in
 * {@code /dashboard/superadmin/audit} actually returns data.
 *
 * <p>Writes are still done by individual services (some via {@code log.warn(...)}
 * lines, some via direct SQL inserts). A future change can route those through
 * a shared {@code AuditService.log(...)} helper for consistency.
 */
@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "user_id")
    private UUID userId;

    /** Free-form action verb, e.g. "USER_APPROVED", "LOGIN", "FEE_PLAN_ACTIVATE". */
    @Column(name = "action", length = 100, nullable = false)
    private String action;

    @Column(name = "entity_type", length = 100)
    private String entityType;

    @Column(name = "entity_id")
    private UUID entityId;

    /** JSONB in Postgres — kept as String here to avoid a hibernate-types dep. */
    @Column(name = "old_values", columnDefinition = "jsonb")
    private String oldValues;

    @Column(name = "new_values", columnDefinition = "jsonb")
    private String newValues;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
