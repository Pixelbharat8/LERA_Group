package com.lera.academy_service.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthUser {
    private UUID userId;
    private UUID centerId;
    private UUID roleId;
    private String roleName;
    private String email;
}
