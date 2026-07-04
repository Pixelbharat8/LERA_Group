package com.lera.ai_gateway.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.LoadingCache;
import jakarta.servlet.*;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class RateLimitFilter implements Filter {

    // AI endpoints are more expensive - lower limit. Bucketed PER USER (JWT subject), not per IP,
    // so a user rotating IPs can't multiply their allowance on the paid endpoints.
    private static final int MAX_REQUESTS_PER_MINUTE = 30;

    private static final Pattern SUB = Pattern.compile("\"(?:sub|userId|user_id)\"\\s*:\\s*\"([^\"]+)\"");

    private final LoadingCache<String, AtomicInteger> requestCounts = Caffeine.newBuilder()
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .build(key -> new AtomicInteger(0));

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;

        // Never throttle health/monitoring or docs — infra probes must always pass.
        String path = httpRequest.getRequestURI();
        if (path != null && (path.startsWith("/actuator") || path.startsWith("/swagger") || path.startsWith("/v3/api-docs"))) {
            chain.doFilter(request, response);
            return;
        }

        AtomicInteger counter = requestCounts.get(rateLimitKey(httpRequest));
        if (counter != null && counter.incrementAndGet() > MAX_REQUESTS_PER_MINUTE) {
            HttpServletResponse httpResponse = (HttpServletResponse) response;
            httpResponse.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            httpResponse.setContentType("application/json");
            httpResponse.getWriter().write("{\"error\":\"Rate limit exceeded.\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    /** Prefer a per-user bucket (JWT subject); fall back to IP for unauthenticated requests. */
    private String rateLimitKey(HttpServletRequest req) {
        String sub = jwtSubject(bearerOrCookieToken(req));
        return sub != null ? "u:" + sub : "ip:" + getClientIp(req);
    }

    /** Extract a stable per-user claim from the JWT payload. Unverified — used ONLY for bucketing;
     *  forged tokens are rejected by the auth filter before reaching any paid endpoint. */
    private static String jwtSubject(String jwt) {
        if (jwt == null) return null;
        try {
            String[] parts = jwt.split("\\.");
            if (parts.length < 2) return null;
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            Matcher m = SUB.matcher(payload);
            return m.find() ? m.group(1) : null;
        } catch (Exception e) {
            return null;
        }
    }

    private static String bearerOrCookieToken(HttpServletRequest req) {
        String auth = req.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) return auth.substring(7);
        Cookie[] cookies = req.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if ("token".equals(c.getName())) return c.getValue();
            }
        }
        return null;
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) return xff.split(",")[0].trim();
        String xri = request.getHeader("X-Real-IP");
        if (xri != null && !xri.isEmpty()) return xri;
        return request.getRemoteAddr();
    }
}
