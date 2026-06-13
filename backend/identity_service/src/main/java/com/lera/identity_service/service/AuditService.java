package com.lera.identity_service.service;

import com.lera.identity_service.entity.AuditLog;
import com.lera.identity_service.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Thin write-side helper for {@link AuditLog}. Other controllers / services
 * can call {@link #log(String, String, UUID, UUID, String, String)} to record
 * a sensitive action without copy-pasting boilerplate.
 *
 * <p>Best-effort: any failure is swallowed and logged at WARN — never block
 * the caller's primary work because the audit insert failed.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository repository;

    /**
     * Record an audit entry. {@code userId} is the actor; pass {@code null}
     * for system-level actions. {@code oldValues}/{@code newValues} should
     * be JSON strings (or {@code null}).
     */
    public void log(
            String action,
            String entityType,
            UUID entityId,
            UUID userId,
            String oldValues,
            String newValues) {
        try {
            HttpServletRequest req = currentRequest();
            AuditLog entry = AuditLog.builder()
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .userId(userId)
                    .oldValues(oldValues)
                    .newValues(newValues)
                    .ipAddress(req != null ? clientIp(req) : null)
                    .userAgent(req != null ? req.getHeader("User-Agent") : null)
                    .createdAt(LocalDateTime.now())
                    .build();
            repository.save(entry);
        } catch (Exception e) {
            log.warn("Failed to write audit log for action={}: {}", action, e.getMessage());
        }
    }

    private static HttpServletRequest currentRequest() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attrs != null ? attrs.getRequest() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private static String clientIp(HttpServletRequest req) {
        String fwd = req.getHeader("X-Forwarded-For");
        if (fwd != null && !fwd.isBlank()) return fwd.split(",")[0].trim();
        String real = req.getHeader("X-Real-IP");
        if (real != null && !real.isBlank()) return real;
        return req.getRemoteAddr();
    }
}
