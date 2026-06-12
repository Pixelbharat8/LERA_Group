package com.lera.academy_service.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

/**
 * Locks the defence-in-depth contract: requests routed at {@code /api/internal/**} are rejected
 * (503 if the configured key is the legacy literal, 401 if the supplied header doesn't match a
 * strong configured key). Non-internal paths always pass through.
 */
class InternalApiKeyAuthFilterTest {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void rejectsInternalRequestWhenConfiguredKeyIsLegacyLiteral() throws Exception {
        // Filter is constructed with the legacy literal — should behave as if unset (503 on /api/internal/**).
        InternalApiKeyAuthFilter filter = new InternalApiKeyAuthFilter(
                InternalApiKeyValidator.LEGACY_WEAK_KEY);

        MockHttpServletRequest req = new MockHttpServletRequest("POST",
                "/api/internal/student-skill-levels/placement-record");
        req.addHeader("X-Internal-Key", InternalApiKeyValidator.LEGACY_WEAK_KEY);
        MockHttpServletResponse resp = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, resp, chain);

        assertThat(resp.getStatus()).isEqualTo(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
        assertThat(resp.getContentAsString()).contains("Internal API key not configured");
        verify(chain, never()).doFilter(req, resp);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void rejectsInternalRequestWithMismatchedKey() throws Exception {
        InternalApiKeyAuthFilter filter = new InternalApiKeyAuthFilter("strong-prod-key");

        MockHttpServletRequest req = new MockHttpServletRequest("POST",
                "/api/internal/student-skill-levels/placement-record");
        req.addHeader("X-Internal-Key", "wrong");
        MockHttpServletResponse resp = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, resp, chain);

        assertThat(resp.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
        verify(chain, never()).doFilter(req, resp);
    }

    @Test
    void allowsInternalRequestWithMatchingStrongKey() throws Exception {
        InternalApiKeyAuthFilter filter = new InternalApiKeyAuthFilter("strong-prod-key");

        MockHttpServletRequest req = new MockHttpServletRequest("POST",
                "/api/internal/student-skill-levels/placement-record");
        req.addHeader("X-Internal-Key", "strong-prod-key");
        MockHttpServletResponse resp = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, resp, chain);

        verify(chain, times(1)).doFilter(req, resp);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getAuthorities())
                .extracting(Object::toString)
                .containsExactly("ROLE_INTERNAL_SERVICE");
    }

    @Test
    void nonInternalPathsAlwaysPassThrough() throws Exception {
        InternalApiKeyAuthFilter filter = new InternalApiKeyAuthFilter(
                InternalApiKeyValidator.LEGACY_WEAK_KEY);

        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/students");
        MockHttpServletResponse resp = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, resp, chain);

        verify(chain, times(1)).doFilter(req, resp);
        assertThat(resp.getStatus()).isEqualTo(HttpServletResponse.SC_OK);
    }
}
