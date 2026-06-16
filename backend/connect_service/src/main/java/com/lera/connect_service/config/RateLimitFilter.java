package com.lera.connect_service.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.LoadingCache;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitFilter implements Filter {

    // Keyed PER USER (not per IP), so a whole office sharing one public IP isn't
    // throttled as a single client. The chat UI polls a few endpoints every few
    // seconds (~30 req/min/user), so this leaves generous headroom while still
    // stopping a runaway client.
    private static final int MAX_REQUESTS_PER_MINUTE = 300;

    private final LoadingCache<String, AtomicInteger> requestCounts = Caffeine.newBuilder()
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .build(key -> new AtomicInteger(0));

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String clientKey = getClientKey(httpRequest);
        AtomicInteger counter = requestCounts.get(clientKey);
        if (counter != null && counter.incrementAndGet() > MAX_REQUESTS_PER_MINUTE) {
            HttpServletResponse httpResponse = (HttpServletResponse) response;
            httpResponse.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            httpResponse.setContentType("application/json");
            httpResponse.getWriter().write("{\"error\":\"Rate limit exceeded.\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    /**
     * Per-user key: the bearer JWT uniquely identifies the session, so users behind a
     * shared NAT/office IP each get their own bucket. We hash the token (don't store the
     * raw secret) and fall back to client IP for unauthenticated requests.
     */
    private String getClientKey(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            String token = auth.substring(7).trim();
            if (!token.isEmpty()) {
                return "u:" + Integer.toHexString(token.hashCode());
            }
        }
        return "ip:" + getClientIp(request);
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) return xff.split(",")[0].trim();
        String xri = request.getHeader("X-Real-IP");
        if (xri != null && !xri.isEmpty()) return xri;
        return request.getRemoteAddr();
    }
}
