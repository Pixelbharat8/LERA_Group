package com.lera.identity_service.controller;

import com.lera.identity_service.entity.Role;
import com.lera.identity_service.entity.RolePermission;
import com.lera.identity_service.repository.RoleRepository;
import com.lera.identity_service.repository.RolePermissionRepository;
import com.lera.identity_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
// Reads (role/permission catalogue) are staff/management only — never STUDENT/PARENT, who must not
// be able to enumerate the RBAC model. Write methods keep their stricter SUPER_ADMIN/CHAIRMAN rules
// (method-level @PreAuthorize overrides this class-level default).
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','ADMIN','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','STAFF','TEACHER','TEACHING_ASSISTANT','TA')")
public class RoleController {
    
    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final UserRepository userRepository;
    
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllRoles(Pageable pageable) {
        List<Role> roles = roleRepository.findAll(pageable).getContent();
        
        List<Map<String, Object>> rolesWithCounts = roles.stream().map(role -> {
            Map<String, Object> roleMap = new HashMap<>();
            roleMap.put("id", role.getId());
            roleMap.put("name", role.getName());
            roleMap.put("displayName", role.getDisplayName());
            roleMap.put("displayNameVi", role.getDisplayNameVi());
            roleMap.put("description", role.getDescription());
            roleMap.put("level", role.getLevel());
            roleMap.put("isSystemRole", role.getIsSystemRole());
            roleMap.put("usersCount", userRepository.countByRoleId(role.getId()));
            
            // Add permissions for this role
            List<String> permissions = rolePermissionRepository.findByRoleId(role.getId())
                    .stream()
                    .map(RolePermission::getPermissionCode)
                    .collect(Collectors.toList());
            roleMap.put("permissions", permissions);
            
            return roleMap;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(rolesWithCounts);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Role> getRoleById(@PathVariable UUID id) {
        return roleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<Role> createRole(@Valid @RequestBody Role role) {
        if (roleRepository.findByName(role.getName()).isPresent()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(roleRepository.save(role));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<Role> updateRole(@PathVariable UUID id, @Valid @RequestBody Role roleDetails) {
        return roleRepository.findById(id).map(role -> {
            if (roleDetails.getName() != null) role.setName(roleDetails.getName());
            if (roleDetails.getDisplayName() != null) role.setDisplayName(roleDetails.getDisplayName());
            if (roleDetails.getDisplayNameVi() != null) role.setDisplayNameVi(roleDetails.getDisplayNameVi());
            if (roleDetails.getDescription() != null) role.setDescription(roleDetails.getDescription());
            if (roleDetails.getLevel() != null) role.setLevel(roleDetails.getLevel());
            return ResponseEntity.ok(roleRepository.save(role));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<Void> deleteRole(@PathVariable UUID id) {
        return roleRepository.findById(id).map(role -> {
            // Prevent deletion of system roles
            if (Boolean.TRUE.equals(role.getIsSystemRole())) {
                return ResponseEntity.badRequest().<Void>build();
            }
            roleRepository.delete(role);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    // ==================== ROLE PERMISSIONS ====================

    @GetMapping("/{id}/permissions")
    public ResponseEntity<Map<String, Object>> getRolePermissions(@PathVariable UUID id) {
        return roleRepository.findById(id).map(role -> {
            Map<String, Object> response = new HashMap<>();
            List<String> permissions = rolePermissionRepository.findByRoleId(id)
                    .stream()
                    .map(RolePermission::getPermissionCode)
                    .collect(Collectors.toList());
            response.put("roleId", id);
            response.put("roleName", role.getName());
            response.put("permissions", permissions);
            return ResponseEntity.ok(response);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/permissions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    @Transactional
    public ResponseEntity<Map<String, Object>> updateRolePermissions(
            @PathVariable UUID id,
            @Valid @RequestBody Map<String, List<String>> body) {
        
        Map<String, Object> response = new HashMap<>();
        
        if (!roleRepository.existsById(id)) {
            response.put("success", false);
            response.put("message", "Role not found");
            return ResponseEntity.notFound().build();
        }

        List<String> newPermissions = body.get("permissions");
        if (newPermissions == null) {
            response.put("success", false);
            response.put("message", "Permissions list is required");
            return ResponseEntity.badRequest().body(response);
        }

        // Delete all existing permissions for this role
        rolePermissionRepository.deleteByRoleId(id);
        
        // Add new permissions
        for (String permissionCode : newPermissions) {
            RolePermission rp = RolePermission.builder()
                    .roleId(id)
                    .permissionCode(permissionCode)
                    .build();
            rolePermissionRepository.save(rp);
        }

        response.put("success", true);
        response.put("message", "Permissions updated successfully");
        response.put("permissions", newPermissions);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/permissions/{permissionCode}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<Map<String, Object>> addPermissionToRole(
            @PathVariable UUID id,
            @PathVariable String permissionCode) {
        
        Map<String, Object> response = new HashMap<>();
        
        if (!roleRepository.existsById(id)) {
            response.put("success", false);
            response.put("message", "Role not found");
            return ResponseEntity.notFound().build();
        }

        if (rolePermissionRepository.existsByRoleIdAndPermissionCode(id, permissionCode)) {
            response.put("success", false);
            response.put("message", "Permission already assigned to this role");
            return ResponseEntity.badRequest().body(response);
        }

        RolePermission rp = RolePermission.builder()
                .roleId(id)
                .permissionCode(permissionCode)
                .build();
        rolePermissionRepository.save(rp);

        response.put("success", true);
        response.put("message", "Permission added successfully");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/permissions/{permissionCode}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    @Transactional
    public ResponseEntity<Map<String, Object>> removePermissionFromRole(
            @PathVariable UUID id,
            @PathVariable String permissionCode) {
        
        Map<String, Object> response = new HashMap<>();
        
        if (!roleRepository.existsById(id)) {
            response.put("success", false);
            response.put("message", "Role not found");
            return ResponseEntity.notFound().build();
        }

        rolePermissionRepository.deleteByRoleIdAndPermissionCode(id, permissionCode);

        response.put("success", true);
        response.put("message", "Permission removed successfully");
        return ResponseEntity.ok(response);
    }
}
