package com.lera.identity_service.security;

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
 *   1. ROLE layer — role_permissions table (granular codes, e.g. users.create).
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

    /** Module governing this path ("users" / "settings"), or null if unmapped. */
    private String baseModule(String path) {
        // Self-service on one's OWN record (/api/users/me/**: view/edit own profile, change own
        // password) is authorised by authentication alone (+ current-password check for the
        // password change) — it must NOT require the admin users.create/users.view permission,
        // otherwise low-privilege imported accounts can't complete the forced first-login
        // password change or see their own profile.
        if (matches(path, "/api/users/me")) return null;
        if (matches(path, "/api/users") || matches(path, "/api/staff")
                || matches(path, "/api/user-roles") || matches(path, "/api/user-permissions")) {
            return "users";
        }
        if (matches(path, "/api/roles") || matches(path, "/api/permissions")
                || matches(path, "/api/centers") || matches(path, "/api/departments")
                || matches(path, "/api/tenants") || matches(path, "/api/system-settings")
                || matches(path, "/api/tenant-settings") || matches(path, "/api/website-settings")
                || matches(path, "/api/feature-flags")) {
            return "settings";
        }
        return null; // auth, health, impersonation, logs, approvals … stay role-only
    }

    /** identity_service map. GET→.view; mutations→users.create / settings.edit. null = unmapped (allow). */
    private String requiredPermission(String method, String path) {
        String base = baseModule(path);
        if (base == null) return null;
        if ("GET".equalsIgnoreCase(method)) return base + ".view";
        return base.equals("settings") ? "settings.edit" : "users.create";
    }

    /** The user_permissions column governing this path, or null if unmapped. */
    private String userPermissionColumn(String path) {
        String base = baseModule(path);
        return base == null ? null : base + "_access"; // users_access / settings_access
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
