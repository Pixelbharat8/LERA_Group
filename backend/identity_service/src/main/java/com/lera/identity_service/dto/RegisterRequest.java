package com.lera.identity_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {
    private UUID centerId;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String phone;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Full name is required")
    private String fullname;

    private String fullnameVi;
    private String avatarUrl;
    private String dateOfBirth;
    private String gender;
    private String address;
    private String roleName;
    private String status;
    
    // Organization hierarchy fields
    private UUID departmentId;
    private UUID reportsTo;
    private String jobTitle;
    private String employmentType;
    private Integer orgLevel;

    /**
     * Ask for the account to be created with "must change password on first login" set. Bulk
     * provisioning ships a temporary password, so the caller needs to be able to say so — the
     * identity service's own bulk import already set this flag directly on the entity, but a
     * service calling /api/auth/register over REST had no way to request it.
     */
    private Boolean passwordChangeRequired;
}
