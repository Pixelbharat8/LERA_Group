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
}
