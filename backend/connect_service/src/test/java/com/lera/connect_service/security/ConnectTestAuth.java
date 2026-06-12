package com.lera.connect_service.security;

import java.util.UUID;

/** Test principals for CRM controller unit tests (org-wide bypasses per-lead center checks). */
public final class ConnectTestAuth {

    private ConnectTestAuth() {}

    public static AuthUser orgWide() {
        return AuthUser.builder()
                .userId(UUID.randomUUID())
                .roleName("CEO")
                .build();
    }

    public static AuthUser participant(UUID userId) {
        return AuthUser.builder()
                .userId(userId)
                .centerId(UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"))
                .roleName("STAFF")
                .build();
    }

    public static AuthUser centerManager(UUID centerId) {
        return AuthUser.builder()
                .userId(UUID.randomUUID())
                .centerId(centerId)
                .roleName("CENTER_MANAGER")
                .build();
    }
}
