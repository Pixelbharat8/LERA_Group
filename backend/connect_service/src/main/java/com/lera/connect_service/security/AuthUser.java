package com.lera.connect_service.security;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthUser {
    private UUID userId;
    private UUID centerId;
    private String roleName;
    private String email;
}
