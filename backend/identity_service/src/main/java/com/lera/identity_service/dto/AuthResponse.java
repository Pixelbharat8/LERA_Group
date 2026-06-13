package com.lera.identity_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private String refreshToken;
    private UserDTO user;
    private String message;
    private boolean success;
    
    // Additional fields for frontend compatibility
    @Builder.Default
    private String tokenType = "Bearer";
    
    private Long expiresIn; // Token expiration time in seconds
    
    private Set<String> roles; // User roles for quick access
    
    private List<String> permissions; // User permissions for quick access
}
