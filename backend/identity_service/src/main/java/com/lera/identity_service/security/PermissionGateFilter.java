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
import java.util.concurrent.ConcurrentHashMap;

/**
 * Subtractive, fail-open permission gate. Runs AFTER JWT auth.
 *
 * For endpoints mapped below it requires the caller's ROLE to hold the matching granular
 * permission (role_permissions table, edited via the Chairman Roles & Permissions grid).
 * Unmapped endpoints pass through (role-based @PreAuthorize still applies). God-mode roles
 * are never gated. Roles are seeded generously, so this only bites once a permission is
 * explicitly REMOVED from a role in the grid.
 */
@Component
public class PermissionGateFilter extends OncePerRequestFilter {

    private final JdbcTemplate jdbc;
    public PermissionGateFilter(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    private static final Set<String> GOD_MODE = Set.of(
            "CHAIRMAN", "SUPER_ADMIN", "SUPERADMIN", "CEO", "DIRECTOR", "ADMIN");

    private final Map<String, Object[]> cache = new ConcurrentHashMap<>();
    private static final long TTL_MS = 15_000;

    /** identity_service map. GET→.view; mutations→users.create / settings.edit. null = unmapped (allow). */
    private String requiredPermission(String method, String path) {
        String base;
        if (matches(path, "/api/users") || matches(path, "/api/staff")
                || matches(path, "/api/user-roles") || matches(path, "/api/user-permissions")) {
            base = "users";
        } else if (matches(path, "/api/roles") || matches(path, "/api/permissions")
                || matches(path, "/api/centers") || matches(path, "/api/departments")
                || matches(path, "/api/tenants") || matches(path, "/api/system-settings")
                || matches(path, "/api/tenant-settings") || matches(path, "/api/website-settings")
                || matches(path, "/api/feature-flags")) {
            base = "settings";
        } else {
            return null; // auth, health, impersonation, logs, approvals … stay role-only
        }
        if ("GET".equalsIgnoreCase(method)) return base + ".view";
        return base.equals("settings") ? "settings.edit" : "users.create";
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
        if (GOD_MODE.contains(R) || roleHas(R, required)) { chain.doFilter(req, res); return; }

        res.setStatus(HttpStatus.FORBIDDEN.value());
        res.setContentType("application/json");
        res.getWriter().write("{\"success\":false,\"message\":\"Permission denied: " + required + "\"}");
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
