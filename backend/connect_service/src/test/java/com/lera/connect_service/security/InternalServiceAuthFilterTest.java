package com.lera.connect_service.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class InternalServiceAuthFilterTest {

    @Test
    void wrong_key_header_returns_401() throws ServletException, IOException {
        InternalServiceAuthFilter filter = new InternalServiceAuthFilter("correct-secret");

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("POST");
        request.setRequestURI("/api/notifications/trigger");
        request.addHeader("X-Internal-Key", "WRONG");

        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean chainCalled = new AtomicBoolean();
        FilterChain chain = (req, res) -> chainCalled.set(true);

        filter.doFilterInternal(request, response, chain);

        assertEquals(HttpServletResponse.SC_UNAUTHORIZED, response.getStatus());
        assertEquals("application/json", response.getContentType().split(";")[0].trim());
        assertTrue(response.getContentAsString().contains("invalid_internal_key"));
        assertTrue(!chainCalled.get());
    }

    @Test
    void missing_header_still_invokes_chain() throws ServletException, IOException {
        InternalServiceAuthFilter filter = new InternalServiceAuthFilter("correct-secret");

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("POST");
        request.setRequestURI("/api/notifications/trigger");

        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilterInternal(request, response, chain);

        assertEquals(HttpServletResponse.SC_OK, response.getStatus());
    }

    @Test
    void matching_key_invokes_chain() throws ServletException, IOException {
        InternalServiceAuthFilter filter = new InternalServiceAuthFilter("correct-secret");

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("POST");
        request.setRequestURI("/api/notifications/trigger");
        request.addHeader("X-Internal-Key", "correct-secret");

        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilterInternal(request, response, chain);

        assertEquals(HttpServletResponse.SC_OK, response.getStatus());
    }
}
