package com.lera.connect_service.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

/**
 * Puts a per-request correlation id into the SLF4J MDC ("traceId") so every log line
 * for a request can be tied together — and across services, since the id is echoed in
 * the response and can be forwarded on internal calls. Reuses an inbound
 * X-Request-Id / X-Correlation-Id when present, otherwise generates one.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter implements Filter {

    public static final String REQUEST_ID_HEADER = "X-Request-Id";
    public static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
    public static final String MDC_KEY = "traceId";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        String traceId = null;
        if (request instanceof HttpServletRequest http) {
            traceId = firstNonBlank(http.getHeader(REQUEST_ID_HEADER), http.getHeader(CORRELATION_ID_HEADER));
        }
        if (traceId == null) {
            traceId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        }
        MDC.put(MDC_KEY, traceId);
        try {
            if (response instanceof HttpServletResponse http) {
                http.setHeader(REQUEST_ID_HEADER, traceId);
            }
            chain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
        }
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) return a;
        if (b != null && !b.isBlank()) return b;
        return null;
    }
}
