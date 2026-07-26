package com.lera.identity_service.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    // WRITE_ONLY: accepted on input (create/import) but NEVER serialized out — otherwise any
    // endpoint returning a raw User (e.g. GET /api/staff) leaks the bcrypt hash to the client.
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    
    @Column(nullable = false)
    private String fullname;
    
    @Column(name = "fullname_vi")
    private String fullnameVi;
    
    @Column(length = 50)
    private String phone;
    
    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;
    
    @Column(name = "role_id")
    private UUID roleId;
    
    @Column(name = "center_id")
    private UUID centerId;
    
    @Column(name = "department_id")
    private UUID departmentId;
    
    @Column(name = "reports_to")
    private UUID reportsTo;
    
    @Column(name = "job_title")
    private String jobTitle;
    
    @Column(name = "employment_type")
    private String employmentType;
    
    @Column(name = "org_level")
    private Integer orgLevel;
    
    @Column(length = 20)
    @Builder.Default
    private String status = "ACTIVE";
    
    @Column(name = "email_verified")
    @Builder.Default
    private Boolean emailVerified = false;

    // True for auto-provisioned import accounts (default password) — the user must set a new
    // password on first login. Cleared the moment they change it.
    @Column(name = "password_change_required")
    @Builder.Default
    private Boolean passwordChangeRequired = false;

    // Bumped on every password change/reset. Stamped into issued tokens as the "tv" claim;
    // a refresh token whose tv no longer matches is rejected at /refresh, so stolen/old
    // refresh tokens can't mint new access tokens after the password is changed.
    @Column(name = "token_version")
    @Builder.Default
    private Integer tokenVersion = 0;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    // ─── Approval workflow (see migrations/add_approval_workflow.sql) ───
    @Column(name = "approval_status", length = 20)
    private String approvalStatus;

    @Column(name = "requested_by")
    private UUID requestedBy;

    @Column(name = "requested_at")
    private LocalDateTime requestedAt;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    // These lazy @ManyToOne overlays are read-only navigation (insertable/updatable=false) on top
    // of the scalar *Id columns above, which carry the real values the API exposes. @JsonIgnore
    // keeps Jackson from serializing the uninitialized Hibernate proxies — which otherwise 500s
    // ("No serializer found for ByteBuddyInterceptor") whenever a raw User is returned (e.g.
    // GET /api/staff) and would throw LazyInitializationException in prod (open-in-view=false).
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "center_id", insertable = false, updatable = false)
    private Center center;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", insertable = false, updatable = false)
    private Role role;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", insertable = false, updatable = false)
    private Department department;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reports_to", insertable = false, updatable = false)
    private User manager;
    
    @PrePersist
    public void onCreate() {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        if (this.createdAt == null) this.createdAt = now;
        if (this.updatedAt == null) this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
