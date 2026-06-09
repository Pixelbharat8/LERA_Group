package com.lera.identity_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private UUID id;
    private UUID centerId;
    private String centerName;
    private UUID roleId;
    private String roleName;
    private UUID departmentId;
    private String departmentName;
    private UUID reportsTo;
    private String reportsToName;
    private Integer directReports;
    private String jobTitle;
    private String employmentType;
    private Integer orgLevel;
    private String email;
    private String phone;
    private String fullname;
    private String fullnameVi;
    private String avatarUrl;
    private String status;
    /** Convenience flag (= status is ACTIVE) for UIs that filter/badge on active state. */
    private Boolean isActive;
    private Boolean emailVerified;
    private String lastLogin;
    private String createdAt;
}
