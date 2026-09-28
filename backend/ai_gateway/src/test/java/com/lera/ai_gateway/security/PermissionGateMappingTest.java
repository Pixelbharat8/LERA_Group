package com.lera.ai_gateway.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * "AI Assistant" has been a switch on the Chairman's Feature Management screen all along, and
 * ai_assistant_access has been a column on user_permissions all along — but nothing in this
 * service ever read it, so a revoked user kept full use of the AI endpoints.
 */
class PermissionGateMappingTest {

    private final PermissionGateFilter filter = new PermissionGateFilter(null);

    @Test
    void aiEndpointsFollowTheAiAssistantToggle() {
        assertEquals("ai_assistant_access", filter.userPermissionColumn("/api/ai"));
        assertEquals("ai_assistant_access", filter.userPermissionColumn("/api/ai/conversations"));
        assertEquals("ai_assistant_access", filter.userPermissionColumn("/api/ai/learning-paths"));
        assertEquals("ai_assistant_access", filter.userPermissionColumn("/api/ai-learning-progress"));
    }

    @Test
    void aPrefixMatchDoesNotLeakOntoAnUnrelatedPath() {
        assertNull(filter.userPermissionColumn("/api/aircon"));
        assertNull(filter.userPermissionColumn("/api/available-slots"));
    }
}
