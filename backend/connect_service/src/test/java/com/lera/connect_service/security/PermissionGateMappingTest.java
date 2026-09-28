package com.lera.connect_service.security;

import jakarta.servlet.DispatcherType;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.PreparedStatementSetter;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The Chairman's Feature Management screen has always stored "Communication" and "Documents",
 * and the sidebar has always hidden the menu on a revoke — but no backend code read either
 * column, so connect_service kept serving chat, messages, notifications and documents to a
 * user whose access had been taken away. These assert the paths the gate now claims.
 */
class PermissionGateMappingTest {

    private final PermissionGateFilter filter = new PermissionGateFilter(null);

    @Test
    void documentEndpointsAreGovernedByTheDocumentsToggle() {
        assertEquals("documents_access", filter.userPermissionColumn("/api/documents"));
        assertEquals("documents_access", filter.userPermissionColumn("/api/documents/42"));
        assertEquals("documents_access", filter.userPermissionColumn("/api/attachments/9"));
    }

    @Test
    void conversationEndpointsAreGovernedByTheCommunicationToggle() {
        for (String path : new String[]{
                "/api/chat", "/api/chat/conversations", "/api/messages", "/api/messaging",
                "/api/broadcasts", "/api/notifications", "/api/groups", "/api/meetings",
                "/api/parent-teacher-meetings"}) {
            assertEquals("communication_access", filter.userPermissionColumn(path),
                    path + " is conversation traffic and must follow the Communication toggle");
        }
    }

    // NOTE: there is deliberately no test asserting that /api/internal/** and /api/public/**
    // are ungated. Every internal endpoint in this service lives under /api/internal/, which
    // sits under no gated prefix, so such a test passes whether or not the guard exists —
    // deleting the guard did not fail it. The guard is kept as a structural safeguard for
    // future paths, but it is not load-bearing today and is not claimed as covered.

    @Test
    void theCrmPipelineIsNotCollateralDamage() {
        // Leads, deals and follow-ups are CRM, not Communication — a revoke must not close them.
        assertNull(filter.userPermissionColumn("/api/leads"));
        assertNull(filter.userPermissionColumn("/api/deals"));
        assertNull(filter.userPermissionColumn("/api/followups"));
    }

    @Test
    void aPrefixMatchDoesNotLeakOntoAnUnrelatedPath() {
        // "/api/messages" must not swallow "/api/messages-archive-export" by string prefix.
        assertNull(filter.userPermissionColumn("/api/messages-archive-export"));
        assertNull(filter.userPermissionColumn("/api/documentsomething"));
    }

    // ---------------------------------------------------------------------------------
    // SERVICE layer — "Connect Service" on the Chairman's screen, stored as
    // connect_service_enabled and read by nothing until now. It must cover every path this
    // service serves, not only the two modules mapped above.
    // ---------------------------------------------------------------------------------

    @Test
    void everyApiPathFallsUnderTheConnectServiceSwitch() {
        assertEquals("connect_service_enabled", filter.serviceColumn("/api/leads"));
        assertEquals("connect_service_enabled", filter.serviceColumn("/api/chat"));
        assertNull(filter.serviceColumn("/api/internal/students/by-user/1"));
        assertNull(filter.serviceColumn("/api/public/leads"));
        assertNull(filter.serviceColumn("/actuator/health"));
    }

    @AfterEach
    void clearAuth() {
        SecurityContextHolder.clearContext();
    }

    /** Answers the column actually named in the SQL — this filter now queries two of them. */
    @SuppressWarnings("unchecked")
    private PermissionGateFilter filterWith(Boolean serviceEnabled, Boolean communication) {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.query(anyString(), any(PreparedStatementSetter.class), any(ResultSetExtractor.class)))
                .thenAnswer(inv -> {
                    String sql = inv.getArgument(0);
                    if (sql.contains("connect_service_enabled")) return serviceEnabled;
                    if (sql.contains("communication_access")) return communication;
                    throw new AssertionError("unexpected column in: " + sql);
                });
        return new PermissionGateFilter(jdbc);
    }

    private HttpServletRequest requestFor(String path) {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getRequestURI()).thenReturn(path);
        when(req.getDispatcherType()).thenReturn(DispatcherType.REQUEST);
        return req;
    }

    private void authenticateAs(String role) {
        AuthUser principal = AuthUser.builder().userId(UUID.randomUUID()).roleName(role).build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role))));
    }

    private void run(PermissionGateFilter f, String path, HttpServletResponse res, FilterChain chain)
            throws Exception {
        when(res.getWriter()).thenReturn(new PrintWriter(new StringWriter()));
        f.doFilter(requestFor(path), res, chain);
    }

    @Test
    void aDisabledConnectServiceBlocksEvenAnUnmappedPath() throws Exception {
        // /api/leads carries no module mapping — before the service layer it was never checked.
        HttpServletResponse res = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);
        authenticateAs("TEACHER");

        run(filterWith(false, true), "/api/leads", res, chain);

        verify(chain, never()).doFilter(any(), any());
        verify(res).setStatus(403);
    }

    @Test
    void anEnabledServiceAndNoRevokeLetsTheRequestThrough() throws Exception {
        HttpServletResponse res = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);
        authenticateAs("TEACHER");

        run(filterWith(null, null), "/api/chat", res, chain); // no row — every user today

        verify(chain).doFilter(any(), any());
    }

    @Test
    void godModeIsNeverGatedByTheServiceSwitch() throws Exception {
        HttpServletResponse res = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);
        authenticateAs("CHAIRMAN");

        run(filterWith(false, false), "/api/chat", res, chain);

        verify(chain).doFilter(any(), any());
    }
}
