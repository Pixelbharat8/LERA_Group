package com.lera.social_media_service.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Same gap as the other services: "Social Media (Facebook)" was a switch the Chairman could
 * throw and social_media_access was a stored column, but no code read it, so a revoked user
 * kept posting, spending ad budget and reading analytics.
 */
class PermissionGateMappingTest {

    private final PermissionGateFilter filter = new PermissionGateFilter(null);

    @Test
    void socialAndAdEndpointsFollowTheSocialMediaToggle() {
        for (String path : new String[]{
                "/api/social-media", "/api/social-media-posts/7", "/api/social-platforms",
                "/api/social-analytics", "/api/ad-accounts", "/api/ad-campaigns",
                "/api/marketing-campaigns", "/api/content-templates", "/api/hashtag-groups"}) {
            assertEquals("social_media_access", filter.userPermissionColumn(path), path);
        }
    }

    @Test
    void theLeadPipelineIsNotClosedByASocialMediaRevoke() {
        // /api/leads and /api/lead-followups are CRM and collide with connect_service paths of
        // the same name; a social-media revoke must not shut the lead pipeline.
        assertNull(filter.userPermissionColumn("/api/leads"));
        assertNull(filter.userPermissionColumn("/api/lead-followups"));
    }

    @Test
    void aPrefixMatchDoesNotLeakOntoAnUnrelatedPath() {
        assertNull(filter.userPermissionColumn("/api/social-media-manager-notes"));
        assertNull(filter.userPermissionColumn("/api/ad-accountants"));
    }
}
