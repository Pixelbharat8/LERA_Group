package com.lera.identity_service.controller;

import com.lera.identity_service.entity.Permission;
import com.lera.identity_service.repository.PermissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.*;
import java.util.stream.Collectors;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/permissions")
public class PermissionController {
    
    @Autowired
    private PermissionRepository permissionRepository;
    
    /**
     * Get all permissions
     */
    @GetMapping
    public ResponseEntity<List<Permission>> getAllPermissions(Pageable pageable) {
        List<Permission> permissions = permissionRepository.findAll(pageable).getContent();
        return ResponseEntity.ok(permissions);
    }
    
    /**
     * Get permissions grouped by module
     */
    @GetMapping("/grouped")
    public ResponseEntity<Map<String, List<Permission>>> getPermissionsGrouped(Pageable pageable) {
        List<Permission> permissions = permissionRepository.findAll(pageable).getContent();
        
        Map<String, List<Permission>> grouped = permissions.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getModule() != null ? p.getModule() : "other",
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
        
        return ResponseEntity.ok(grouped);
    }
    
    /**
     * Get permission by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Permission> getPermissionById(@PathVariable UUID id) {
        return permissionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get permission by code
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<Permission> getPermissionByCode(@PathVariable String code) {
        return permissionRepository.findByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get permissions by module
     */
    @GetMapping("/module/{module}")
    public ResponseEntity<List<Permission>> getPermissionsByModule(@PathVariable String module) {
        List<Permission> permissions = permissionRepository.findByModule(module);
        return ResponseEntity.ok(permissions);
    }
    
    /**
     * Create a new permission
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<?> createPermission(@Valid @RequestBody Permission permission) {
        // Check if code already exists
        if (permissionRepository.findByCode(permission.getCode()).isPresent()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Permission with code '" + permission.getCode() + "' already exists");
            return ResponseEntity.badRequest().body(error);
        }
        
        Permission saved = permissionRepository.save(permission);
        return ResponseEntity.ok(saved);
    }
    
    /**
     * Update a permission
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<?> updatePermission(@PathVariable UUID id, @Valid @RequestBody Permission permissionDetails) {
        return permissionRepository.findById(id).map(permission -> {
            if (permissionDetails.getName() != null) {
                permission.setName(permissionDetails.getName());
            }
            if (permissionDetails.getModule() != null) {
                permission.setModule(permissionDetails.getModule());
            }
            if (permissionDetails.getDescription() != null) {
                permission.setDescription(permissionDetails.getDescription());
            }
            // Don't allow code updates to prevent breaking references
            
            Permission saved = permissionRepository.save(permission);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Delete a permission
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<Map<String, String>> deletePermission(@PathVariable UUID id) {
        Map<String, String> response = new HashMap<>();
        
        return permissionRepository.findById(id).map(permission -> {
            permissionRepository.delete(permission);
            response.put("message", "Permission deleted successfully");
            response.put("code", permission.getCode());
            return ResponseEntity.ok(response);
        }).orElseGet(() -> {
            response.put("error", "Permission not found");
            return ResponseEntity.notFound().build();
        });
    }
    
    /**
     * Get all available modules
     */
    @GetMapping("/modules")
    public ResponseEntity<List<String>> getAllModules(Pageable pageable) {
        List<Permission> permissions = permissionRepository.findAll(pageable).getContent();
        List<String> modules = permissions.stream()
                .map(Permission::getModule)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(modules);
    }
    
    /**
     * Bulk create permissions
     */
    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<Map<String, Object>> bulkCreatePermissions(@Valid @RequestBody List<Permission> permissions) {
        Map<String, Object> response = new HashMap<>();
        List<Permission> created = new ArrayList<>();
        List<String> skipped = new ArrayList<>();
        
        for (Permission permission : permissions) {
            if (permissionRepository.findByCode(permission.getCode()).isPresent()) {
                skipped.add(permission.getCode());
            } else {
                created.add(permissionRepository.save(permission));
            }
        }
        
        response.put("created", created.size());
        response.put("skipped", skipped.size());
        response.put("skippedCodes", skipped);
        
        return ResponseEntity.ok(response);
    }
}
