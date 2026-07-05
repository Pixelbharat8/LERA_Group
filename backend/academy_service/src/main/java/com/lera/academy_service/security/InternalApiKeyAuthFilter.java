package com.lera.academy_service.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

/**
 * Service-to-service auth for {@code /api/internal/**} using {@code X-Internal-Key}
 * matching {@code lera.internal.api-key}.
 */
@Component
@Slf4j
public class InternalApiKeyAuthFilter extends OncePerRequestFilter {

    private final String internalApiKey;

    public InternalApiKeyAuthFilter(@Value("${lera.internal.api-key:}") String internalApiKey) {
        String trimmed = internalApiKey != null ? internalApiKey.trim() : "";
        // Defence-in-depth: the legacy literal lives in public git history. Treat it as "unset"
        // here so requests bearing that value get the same 503 as a blank-key deployment, even if
        // ops accidentally sets it via env. InternalApiKeyValidator already fails fast in prod.
        this.internalApiKey = InternalApiKeyValidator.LEGACY_WEAK_KEY.equals(trimmed) ? "" : trimmed;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String uri = request.getRequestURI();
        if (uri == null || !uri.startsWith("/api/internal/")) {
            filterChain.doFilter(request, response);
            return;
        }

        if (internalApiKey.isEmpty()) {
            log.warn("Rejected /api/internal request — lera.internal.api-key is not set");
            response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            response.setContentType("application/json");
            response.getWriter().write("{\"success\":false,\"message\":\"Internal API key not configured\"}");
            return;
        }

        String header = request.getHeader("X-Internal-Key");
        if (!constantTimeEquals(internalApiKey, header)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"success\":false,\"message\":\"Invalid internal API key\"}");
            return;
        }

        var auth = new UsernamePasswordAuthenticationToken(
                "internal-service",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_INTERNAL_SERVICE")));
        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(auth);
        filterChain.doFilter(request, response);
    }

    /** Constant-time compare so response latency can't leak the key byte-by-byte. */
    private static boolean constantTimeEquals(String expected, String actual) {
        if (actual == null) return false;
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8));
    }
}
