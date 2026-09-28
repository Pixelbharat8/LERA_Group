package com.lera.connect_service.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Subtractive, fail-open per-user permission gate. Runs AFTER JWT auth.
 *
 * Governs the Chairman's "Communication" and "Documents" toggles, which until now were stored and displayed but read by nothing — revoking either hid the menu while connect_service kept serving every endpoint behind it.
 *
 * Unlike the gates in identity/academy/attendance/payment/payroll this carries ONLY the
 * per-user layer, deliberately. The role layer reads granular codes from role_permissions,
 * and no codes are seeded for these modules — a role check here would match nothing and deny
 * every caller. Role authorization stays with the existing @PreAuthorize annotations.
 *
 * Only an explicit {@code false} on the mapped column denies. No row, null, or true → allow,
 * so this can never take away access nobody revoked. God-mode roles are never gated.
 */
@Component
public class PermissionGateFilter extends OncePerRequestFilter {

    private final JdbcTemplate jdbc;
    public PermissionGateFilter(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    private static final Set<String> GOD_MODE = Set.of(
            "CHAIRMAN", "SUPER_ADMIN", "SUPERADMIN", "CEO", "DIRECTOR", "ADMIN");

    private final Map<String, Object[]> userCache = new ConcurrentHashMap<>();
    private static final long TTL_MS = 15_000;

    /** The user_permissions column governing this path, or null when unmapped. */
    String userPermissionColumn(String path) {
        if (path.startsWith("/api/internal/")) return null; // service-to-service, never gated
        if (path.startsWith("/api/public/")) return null;   // anonymous endpoints
        if (matches(path, "/api/documents") || matches(path, "/api/attachments")) {
            return "documents_access";
        }
        if (matches(path, "/api/chat") || matches(path, "/api/messages")
                || matches(path, "/api/messaging") || matches(path, "/api/broadcasts")
                || matches(path, "/api/notifications") || matches(path, "/api/groups")
                || matches(path, "/api/meetings") || matches(path, "/api/parent-teacher-meetings")) {
            return "communication_access";
        }
        return null;
    }

    /**
     * The screen also carries a switch for the whole service ("Connect Service"), stored as
     * user_permissions.connect_service_enabled and likewise read by nothing until now. It governs every
     * request this service serves, so it applies to unmapped paths too.
     */
    String serviceColumn(String path) {
        if (!path.startsWith("/api/")) return null;
        if (path.startsWith("/api/internal/")) return null;
        if (path.startsWith("/api/public/")) return null;
        return "connect_service_enabled";
    }

    static boolean matches(String path, String prefix) {
        return path.equals(prefix) || path.startsWith(prefix + "/") || path.startsWith(prefix + "?");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String column = userPermissionColumn(req.getRequestURI());
        String svcColumn = serviceColumn(req.getRequestURI());
        if (column == null && svcColumn == null) { chain.doFilter(req, res); return; }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) { chain.doFilter(req, res); return; }

        String role = auth.getAuthorities().stream()
                .map(a -> a.getAuthority()).filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5)).findFirst().orElse(null);
        if (role == null || GOD_MODE.contains(role.toUpperCase())) { chain.doFilter(req, res); return; }

        Object p = auth.getPrincipal();
        UUID userId = (p instanceof AuthUser au) ? au.getUserId() : null;
        if (userId != null && svcColumn != null && userExplicitlyDenied(userId, svcColumn)) {
            res.setStatus(HttpStatus.FORBIDDEN.value());
            res.setContentType("application/json");
            res.getWriter().write("{\"success\":false,\"message\":\"Permission denied: "
                    + svcColumn + " (service disabled for this user)\"}");
            return;
        }
        if (userId != null && column != null && userExplicitlyDenied(userId, column)) {
            res.setStatus(HttpStatus.FORBIDDEN.value());
            res.setContentType("application/json");
            res.getWriter().write("{\"success\":false,\"message\":\"Permission denied: "
                    + column + " (revoked for this user)\"}");
            return;
        }
        chain.doFilter(req, res);
    }

    /** True only when a user_permissions row exists for this user AND the column is explicitly false. */
    private boolean userExplicitlyDenied(UUID userId, String column) {
        String key = userId + ":" + column;
        long now = System.currentTimeMillis();
        Object[] entry = userCache.get(key);
        if (entry != null && (long) entry[1] > now) return (boolean) entry[0];
        boolean denied;
        try {
            // `column` comes from the fixed allowlist above — never from user input.
            Boolean v = jdbc.query(
                    "SELECT " + column + " FROM user_permissions WHERE user_id = ?",
                    ps -> ps.setObject(1, userId),
                    rs -> rs.next() ? (Boolean) rs.getObject(1) : null);
            denied = Boolean.FALSE.equals(v); // no row / null / true → allow
        } catch (Exception e) {
            denied = false; // fail-open on lookup error
        }
        userCache.put(key, new Object[]{denied, now + TTL_MS});
        return denied;
    }
}
