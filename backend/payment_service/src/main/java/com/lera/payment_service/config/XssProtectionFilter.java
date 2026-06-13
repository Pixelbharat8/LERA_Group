package com.lera.payment_service.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class XssProtectionFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        chain.doFilter(new XssRequestWrapper((HttpServletRequest) request), response);
    }

    private static class XssRequestWrapper extends HttpServletRequestWrapper {
        public XssRequestWrapper(HttpServletRequest request) { super(request); }

        @Override
        public String getParameter(String name) { return sanitize(super.getParameter(name)); }

        @Override
        public String[] getParameterValues(String name) {
            String[] values = super.getParameterValues(name);
            if (values == null) return null;
            String[] sanitized = new String[values.length];
            for (int i = 0; i < values.length; i++) sanitized[i] = sanitize(values[i]);
            return sanitized;
        }

        private String sanitize(String value) {
            if (value == null) return null;
            return value.replaceAll("<", "&lt;").replaceAll(">", "&gt;")
                    .replaceAll("(?i)<script.*?>.*?</script.*?>", "")
                    .replaceAll("(?i)<.*?javascript:.*?>.*?</.*?>", "");
        }
    }
}
