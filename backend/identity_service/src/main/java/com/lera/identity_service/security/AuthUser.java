package com.lera.identity_service.security;

import lombok.Builder;
import lombok.Value;

import java.util.UUID;

@Value
@Builder
public class AuthUser {
    UUID userId;
    UUID centerId;
    UUID roleId;
    String roleName;
}
