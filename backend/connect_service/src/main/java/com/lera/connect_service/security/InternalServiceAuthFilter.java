package com.lera.connect_service.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
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
 * Allows backend services to call {@code POST /api/notifications/trigger(*)} with
 * {@code X-Internal-Key} matching {@code lera.internal.api-key} when set.
 */
@Component
@Slf4j
public class InternalServiceAuthFilter extends OncePerRequestFilter {

    private final String internalApiKey;

    public InternalServiceAuthFilter(@Value("${lera.internal.api-key:}") String internalApiKey) {
        String trimmed = internalApiKey != null ? internalApiKey.trim() : "";
        // Defence-in-depth: legacy literal is in public git history; treat as unset so the
        // existing "internal trigger disabled" path runs instead of authenticating it.
        this.internalApiKey = InternalApiKeyValidator.LEGACY_WEAK_KEY.equals(trimmed) ? "" : trimmed;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        if (internalApiKey.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        String uri = request.getRequestURI();
        if (!"POST".equalsIgnoreCase(request.getMethod())
                || uri == null
                || !(uri.equals("/api/notifications/trigger") || uri.startsWith("/api/notifications/trigger/"))) {
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("X-Internal-Key");
        if (header != null
                && !header.isEmpty()
                && !constantTimeEquals(internalApiKey, header)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setCharacterEncoding("UTF-8");
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\":\"invalid_internal_key\"}");
            return;
        }

        if (constantTimeEquals(internalApiKey, header)) {
            var auth = new UsernamePasswordAuthenticationToken(
                    "internal-service",
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_INTERNAL_SERVICE")));
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

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
