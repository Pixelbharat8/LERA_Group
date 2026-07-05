package com.lera.identity_service.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.LoadingCache;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Stricter rate limiter for authentication endpoints to prevent brute-force attacks.
 * Max 10 auth requests per minute per IP (vs 100/min for general API).
 * Runs BEFORE the general RateLimitFilter.
 */
@Slf4j
@Component
@Order(1)  // Higher priority than general rate limiter
public class AuthRateLimitFilter implements Filter {

    private static final int MAX_AUTH_REQUESTS_PER_MINUTE = 10;

    // Only honour X-Forwarded-For / X-Real-IP when we're actually behind a trusted reverse
    // proxy/CDN that sets them — otherwise a client can spoof the header and get a fresh
    // rate-limit bucket per request, nullifying this filter. Default OFF (use the real socket
    // address). Set lera.security.trusted-proxy=true in the deployed profile (behind Nginx/CDN),
    // and ensure that proxy OVERWRITES (not appends) X-Forwarded-For with the true client IP.
    @Value("${lera.security.trusted-proxy:false}")
    private boolean trustedProxy;

    private static final Set<String> AUTH_PATHS = Set.of(
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/forgot-password",
        "/api/auth/reset-password"
    );

    private final LoadingCache<String, AtomicInteger> authRequestCounts = Caffeine.newBuilder()
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .build(key -> new AtomicInteger(0));

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String path = httpRequest.getRequestURI();

        // Only apply to auth endpoints
        if (AUTH_PATHS.contains(path)) {
            String clientIp = getClientIp(httpRequest);

            AtomicInteger counter = authRequestCounts.get(clientIp);
            if (counter != null && counter.incrementAndGet() > MAX_AUTH_REQUESTS_PER_MINUTE) {
                log.warn("Auth rate limit exceeded for IP: {} on path: {}", clientIp, path);
                HttpServletResponse httpResponse = (HttpServletResponse) response;
                httpResponse.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                httpResponse.setContentType("application/json");
                httpResponse.getWriter().write(
                    "{\"success\":false,\"message\":\"Too many authentication attempts. Please try again later.\"}"
                );
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        // Client-controlled headers are only trustworthy behind a trusted proxy that sets them.
        if (trustedProxy) {
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                return xForwardedFor.split(",")[0].trim();
            }
            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isEmpty()) {
                return xRealIp;
            }
        }
        return request.getRemoteAddr();
    }
}
