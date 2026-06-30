package com.lera.payroll_service.security;

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
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Subtractive, fail-open permission gate. Runs AFTER JWT auth.
 *
 * Two Chairman-controlled layers, both subtractive (only ever REMOVE access; seeded/defaulted
 * generously so they bite only after an explicit revoke). God-mode roles are never gated.
 *   1. ROLE layer — role_permissions table (granular codes, e.g. finance.create).
 *   2. PER-USER layer — user_permissions table (module booleans, edited via the Chairman's
 *      Feature Management / Roles & Permissions grid). An explicit {@code false} on the mapped
 *      column denies this caller even if their role allows it. No row / null / true → allow.
 * Unmapped endpoints pass through (role-based @PreAuthorize still applies).
 */
@Component
public class PermissionGateFilter extends OncePerRequestFilter {

    private final JdbcTemplate jdbc;
    public PermissionGateFilter(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    private static final Set<String> GOD_MODE = Set.of(
            "CHAIRMAN", "SUPER_ADMIN", "SUPERADMIN", "CEO", "DIRECTOR", "ADMIN");

    private final Map<String, Object[]> cache = new ConcurrentHashMap<>();
    // (userId + ":" + column) -> (Boolean denied, expiryMillis) — per-user layer cache.
    private final Map<String, Object[]> userCache = new ConcurrentHashMap<>();
    private static final long TTL_MS = 15_000;

    /** payroll_service map → finance module. GET→finance.view; mutations→finance.create. null = unmapped (allow). */
    private String requiredPermission(String method, String path) {
        boolean fin = matches(path, "/api/payroll") || matches(path, "/api/payroll-cycles")
                || matches(path, "/api/payroll-records") || matches(path, "/api/salary-components")
                || matches(path, "/api/salary-config") || matches(path, "/api/salary-payouts")
                || matches(path, "/api/tax-settings") || matches(path, "/api/teacher-overtime");
        if (!fin) return null;
        return "GET".equalsIgnoreCase(method) ? "finance.view" : "finance.create";
    }

    /** Payroll endpoints are governed by the Chairman's "payroll" toggle. */
    private String userPermissionColumn(String path) {
        return requiredPermission("GET", path) != null ? "payroll_access" : null;
    }

    private static boolean matches(String path, String prefix) {
        return path.equals(prefix) || path.startsWith(prefix + "/") || path.startsWith(prefix + "?");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String required = requiredPermission(req.getMethod(), req.getRequestURI());
        if (required == null) { chain.doFilter(req, res); return; }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String role = auth == null ? null : auth.getAuthorities().stream()
                .map(a -> a.getAuthority()).filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5)).findFirst().orElse(null);
        if (role == null) { chain.doFilter(req, res); return; }
        String R = role.toUpperCase();
        // God-mode (Chairman/CEO/…) is never gated by either layer.
        if (GOD_MODE.contains(R)) { chain.doFilter(req, res); return; }

        // PER-USER layer: an explicit revoke on the Chairman's Feature Management toggle blocks
        // this caller even if their role would allow it. Only an explicit false denies.
        String upColumn = userPermissionColumn(req.getRequestURI());
        UUID userId = currentUserId(auth);
        if (upColumn != null && userId != null && userExplicitlyDenied(userId, upColumn)) {
            deny(res, required + " (revoked for this user)");
            return;
        }

        // ROLE layer: role_permissions must hold the granular code (seeded generously).
        if (roleHas(R, required)) { chain.doFilter(req, res); return; }

        deny(res, required);
    }

    private void deny(HttpServletResponse res, String detail) throws IOException {
        res.setStatus(HttpStatus.FORBIDDEN.value());
        res.setContentType("application/json");
        res.getWriter().write("{\"success\":false,\"message\":\"Permission denied: " + detail + "\"}");
    }

    private UUID currentUserId(Authentication auth) {
        Object p = auth.getPrincipal();
        return (p instanceof AuthUser au) ? au.getUserId() : null;
    }

    /** True only when a user_permissions row exists for this user AND the column is explicitly false. */
    private boolean userExplicitlyDenied(UUID userId, String column) {
        String key = userId + ":" + column;
        long now = System.currentTimeMillis();
        Object[] entry = userCache.get(key);
        if (entry != null && (long) entry[1] > now) {
            return (boolean) entry[0];
        }
        boolean denied;
        try {
            // `column` comes from a fixed internal allowlist (userPermissionColumn) — not user input.
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

    @SuppressWarnings("unchecked")
    private boolean roleHas(String roleUpper, String code) {
        long now = System.currentTimeMillis();
        Object[] entry = cache.get(roleUpper);
        Set<String> codes;
        if (entry != null && (long) entry[1] > now) {
            codes = (Set<String>) entry[0];
        } else {
            try {
                List<String> list = jdbc.queryForList(
                        "SELECT rp.permission_code FROM role_permissions rp "
                                + "JOIN roles r ON r.id = rp.role_id WHERE UPPER(r.name) = ?",
                        String.class, roleUpper);
                codes = Set.copyOf(list);
            } catch (Exception e) {
                return true; // fail-open on lookup error
            }
            cache.put(roleUpper, new Object[]{codes, now + TTL_MS});
        }
        return codes.contains(code);
    }
}
