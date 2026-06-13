package com.lera.attendance_service.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Slf4j
public class InternalApiKeyAuthFilter extends OncePerRequestFilter {

    private static final String LEGACY_WEAK_KEY = "LERA_INTERNAL_SVC_KEY_2024";

    private final String internalApiKey;

    public InternalApiKeyAuthFilter(@Value("${lera.internal.api-key:}") String internalApiKey) {
        String trimmed = internalApiKey != null ? internalApiKey.trim() : "";
        this.internalApiKey = LEGACY_WEAK_KEY.equals(trimmed) ? "" : trimmed;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();
        if (uri == null || !uri.startsWith("/api/internal/")) {
            filterChain.doFilter(request, response);
            return;
        }

        if (internalApiKey.isEmpty()) {
            log.warn("Rejected /api/internal request — lera.internal.api-key is not set");
            response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            response.setContentType("application/json");
            response.getWriter()
                    .write("{\"success\":false,\"message\":\"Internal API key not configured\"}");
            return;
        }

        if (!internalApiKey.equals(request.getHeader("X-Internal-Key"))) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"success\":false,\"message\":\"Invalid internal API key\"}");
            return;
        }

        var auth = new UsernamePasswordAuthenticationToken(
                "internal-service", null, List.of(new SimpleGrantedAuthority("ROLE_INTERNAL")));
        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(auth);
        filterChain.doFilter(request, response);
    }
}
