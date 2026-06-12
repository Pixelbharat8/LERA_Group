package com.lera.payment_service.service;

import com.lera.payment_service.security.AuthUser;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.sql.Types;
import java.util.UUID;

/**
 * Lightweight, best-effort audit writer that lives directly on top of the
 * shared {@code audit_logs} Postgres table — no per-service JPA entity
 * required.
 *
 * <p>Designed to be copy-pasted into every microservice that needs to record
 * privileged writes (a shared library would be cleaner long-term, but adds a
 * deploy-coordination tax we don't want to pay yet).
 *
 * <p>Failures are swallowed and logged at WARN — audit must never block the
 * primary business operation.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JdbcAuditWriter {

    private final JdbcTemplate jdbc;

    /**
     * Persist a single audit entry.
     *
     * @param action      e.g. {@code FEE_PLAN_ACTIVATED}, {@code INVOICE_GENERATED}
     * @param entityType  the domain type the change targeted, e.g. {@code StudentFeePlan}
     * @param entityId    the affected entity's UUID (nullable for service-level events)
     * @param userId      who did this — defaults to the authenticated principal if {@code null}
     * @param oldValues   pre-image as JSON (nullable)
     * @param newValues   post-image as JSON (nullable)
     */
    public void log(String action, String entityType, UUID entityId,
                    UUID userId, String oldValues, String newValues) {
        try {
            UUID effectiveUserId = userId != null ? userId : currentUserId();
            String ip        = currentIp();
            String userAgent = currentUserAgent();

            jdbc.update(
                    "INSERT INTO audit_logs " +
                    "(action, entity_type, entity_id, user_id, old_values, new_values, ip_address, user_agent) " +
                    "VALUES (?, ?, ?, ?, ?::jsonb, ?::jsonb, ?, ?)",
                    new Object[] {
                        action,
                        entityType,
                        entityId,
                        effectiveUserId,
                        oldValues,
                        newValues,
                        ip,
                        userAgent
                    },
                    new int[] {
                        Types.VARCHAR,
                        Types.VARCHAR,
                        Types.OTHER,
                        Types.OTHER,
                        Types.VARCHAR,
                        Types.VARCHAR,
                        Types.VARCHAR,
                        Types.VARCHAR
                    });
        } catch (Exception ex) {
            log.warn("Audit log write failed for action={} entity={}#{}: {}",
                    action, entityType, entityId, ex.getMessage());
        }
    }

    private UUID currentUserId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof AuthUser u) {
                return u.getUserId();
            }
        } catch (Exception ignored) { /* no auth context — fine */ }
        return null;
    }

    private String currentIp() {
        HttpServletRequest req = currentRequest();
        if (req == null) return null;
        String header = req.getHeader("X-Forwarded-For");
        if (header != null && !header.isBlank()) {
            int comma = header.indexOf(',');
            return comma > 0 ? header.substring(0, comma).trim() : header.trim();
        }
        header = req.getHeader("X-Real-IP");
        if (header != null && !header.isBlank()) return header;
        return req.getRemoteAddr();
    }

    private String currentUserAgent() {
        HttpServletRequest req = currentRequest();
        return req == null ? null : req.getHeader("User-Agent");
    }

    private HttpServletRequest currentRequest() {
        try {
            RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
            if (attrs instanceof ServletRequestAttributes sra) {
                return sra.getRequest();
            }
        } catch (Exception ignored) { /* outside of a request */ }
        return null;
    }
}
