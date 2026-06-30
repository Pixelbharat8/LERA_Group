package com.lera.payment_service.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
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

/**
 * Verifies the two-layer Chairman permission gate, with emphasis on the PER-USER bridge:
 * an explicit {@code false} in user_permissions must block, while no-row / null / true allow,
 * and god-mode roles are never gated. Fee-receipts is the representative mapped endpoint.
 */
class PermissionGateFilterTest {

    private JdbcTemplate jdbc;
    private PermissionGateFilter filter;
    private HttpServletRequest req;
    private HttpServletResponse res;
    private FilterChain chain;

    @BeforeEach
    void setUp() throws Exception {
        jdbc = mock(JdbcTemplate.class);
        filter = new PermissionGateFilter(jdbc);
        req = mock(HttpServletRequest.class);
        res = mock(HttpServletResponse.class);
        chain = mock(FilterChain.class);
        when(res.getWriter()).thenReturn(new PrintWriter(new StringWriter()));
        when(req.getMethod()).thenReturn("POST");
        when(req.getRequestURI()).thenReturn("/api/fee-receipts");
        when(req.getDispatcherType()).thenReturn(jakarta.servlet.DispatcherType.REQUEST);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(String role, UUID userId) {
        AuthUser principal = AuthUser.builder().userId(userId).roleName(role).build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role))));
    }

    /** role_permissions holds finance.create for the role. */
    private void roleHasFinance(boolean has) {
        when(jdbc.queryForList(anyString(), eq(String.class), any()))
                .thenReturn(has ? List.of("finance.create") : List.of());
    }

    /** user_permissions.payments_access for the caller: TRUE / FALSE / null (no row). */
    @SuppressWarnings("unchecked")
    private void userPaymentsAccess(Boolean value) {
        when(jdbc.query(anyString(), any(PreparedStatementSetter.class), any(ResultSetExtractor.class)))
                .thenReturn(value);
    }

    @Test
    void godModeRole_isNeverGated_evenWhenExplicitlyDenied() throws Exception {
        authenticateAs("CHAIRMAN", UUID.randomUUID());
        userPaymentsAccess(Boolean.FALSE); // would deny a normal user
        filter.doFilter(req, res, chain);
        verify(chain).doFilter(req, res);
        verify(res, never()).setStatus(403);
    }

    @Test
    void roleAllows_andNoUserRow_isAllowed() throws Exception {
        authenticateAs("CENTER_MANAGER", UUID.randomUUID());
        roleHasFinance(true);
        userPaymentsAccess(null); // no user_permissions row
        filter.doFilter(req, res, chain);
        verify(chain).doFilter(req, res);
    }

    @Test
    void roleAllows_butUserExplicitlyRevoked_isDenied() throws Exception {
        authenticateAs("CENTER_MANAGER", UUID.randomUUID());
        roleHasFinance(true);
        userPaymentsAccess(Boolean.FALSE); // Chairman revoked Payments for this user
        filter.doFilter(req, res, chain);
        verify(chain, never()).doFilter(req, res);
        verify(res).setStatus(403);
    }

    @Test
    void roleAllows_andUserExplicitlyGranted_isAllowed() throws Exception {
        authenticateAs("CENTER_MANAGER", UUID.randomUUID());
        roleHasFinance(true);
        userPaymentsAccess(Boolean.TRUE);
        filter.doFilter(req, res, chain);
        verify(chain).doFilter(req, res);
    }

    @Test
    void roleLacksPermission_isDenied() throws Exception {
        authenticateAs("CENTER_MANAGER", UUID.randomUUID());
        roleHasFinance(false);
        userPaymentsAccess(null);
        filter.doFilter(req, res, chain);
        verify(chain, never()).doFilter(req, res);
        verify(res).setStatus(403);
    }

    @Test
    void unmappedPath_passesThrough() throws Exception {
        when(req.getRequestURI()).thenReturn("/api/payment-methods/active");
        authenticateAs("CENTER_MANAGER", UUID.randomUUID());
        filter.doFilter(req, res, chain);
        verify(chain).doFilter(req, res);
    }
}
