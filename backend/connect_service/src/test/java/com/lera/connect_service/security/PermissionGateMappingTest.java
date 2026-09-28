package com.lera.connect_service.security;

import org.junit.jupiter.api.Test;

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
}
