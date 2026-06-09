package com.lera.identity_service.controller;

import com.lera.identity_service.entity.Tenant;
import com.lera.identity_service.model.ApiResponse;
import com.lera.identity_service.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<Tenant>> createTenant(@Valid @RequestBody Tenant tenant) {
        try {
            Tenant created = tenantService.createTenant(tenant);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(created, "Tenant created successfully"));
        } catch (IllegalArgumentException e) {
            String msg = e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "Invalid request";
            return ResponseEntity.badRequest()
                    .body((ApiResponse<Tenant>) ApiResponse.error(msg));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Tenant>> getTenant(@PathVariable UUID id) {
        return tenantService.getTenantById(id)
                .map(tenant -> ResponseEntity.ok(ApiResponse.success(tenant)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<Tenant>> getTenantByCode(@PathVariable String code) {
        return tenantService.getTenantByCode(code)
                .map(tenant -> ResponseEntity.ok(ApiResponse.success(tenant)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Tenant>>> getAllTenants() {
        List<Tenant> tenants = tenantService.getAllTenants();
        return ResponseEntity.ok(ApiResponse.success(tenants));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<Tenant>> updateTenant(
            @PathVariable UUID id,
            @Valid @RequestBody Tenant tenant) {
        try {
            Tenant updated = tenantService.updateTenant(id, tenant);
            return ResponseEntity.ok(ApiResponse.success(updated, "Tenant updated successfully"));
        } catch (IllegalArgumentException e) {
            String msg = e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "Invalid request";
            return ResponseEntity.badRequest()
                    .body((ApiResponse<Tenant>) ApiResponse.error(msg));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<ApiResponse<Void>> deleteTenant(@PathVariable UUID id) {
        tenantService.deleteTenant(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Tenant deleted successfully"));
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Boolean>> isTenantActive(@PathVariable UUID id) {
        boolean isActive = tenantService.isSubscriptionActive(id);
        return ResponseEntity.ok(ApiResponse.success(isActive));
    }
}
