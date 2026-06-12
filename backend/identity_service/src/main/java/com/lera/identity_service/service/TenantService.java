package com.lera.identity_service.service;

import com.lera.identity_service.entity.Tenant;
import com.lera.identity_service.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TenantService {

    private final TenantRepository tenantRepository;
    private final ActivityLogService activityLogService;

    @Transactional(readOnly = true)
    public List<Tenant> getAllTenants() {
        log.info("Fetching all tenants");
        return tenantRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Tenant> getTenantById(UUID id) {
        log.info("Fetching tenant by id: {}", id);
        return tenantRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Tenant> getTenantByCode(String code) {
        log.info("Fetching tenant by code: {}", code);
        return tenantRepository.findByCode(code);
    }

    @Transactional
    public Tenant createTenant(Tenant tenant) {
        log.info("Creating new tenant: {}", tenant.getCode());
        
        if (tenantRepository.existsByCode(tenant.getCode())) {
            throw new IllegalArgumentException("Tenant with code " + tenant.getCode() + " already exists");
        }
        
        Tenant savedTenant = tenantRepository.save(tenant);
        
        activityLogService.log(null, savedTenant.getId(), "TENANT_CREATED", 
            "Tenant created: " + savedTenant.getName());
        
        return savedTenant;
    }

    @Transactional
    public Tenant updateTenant(UUID id, Tenant tenantDetails) {
        log.info("Updating tenant: {}", id);
        
        Tenant tenant = tenantRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + id));
        
        tenant.setName(tenantDetails.getName());
        tenant.setDomain(tenantDetails.getDomain());
        tenant.setSubdomain(tenantDetails.getSubdomain());
        tenant.setStatus(tenantDetails.getStatus());
        tenant.setSubscriptionPlan(tenantDetails.getSubscriptionPlan());
        tenant.setSubscriptionExpiresAt(tenantDetails.getSubscriptionExpiresAt());
        tenant.setMaxCenters(tenantDetails.getMaxCenters());
        tenant.setMaxUsers(tenantDetails.getMaxUsers());
        tenant.setFeatures(tenantDetails.getFeatures());
        tenant.setUpdatedAt(LocalDateTime.now());
        
        Tenant updated = tenantRepository.save(tenant);
        
        activityLogService.log(null, tenant.getId(), "TENANT_UPDATED", 
            "Tenant updated: " + tenant.getName());
        
        return updated;
    }

    @Transactional
    public void deleteTenant(UUID id) {
        log.info("Deleting tenant: {}", id);
        
        Tenant tenant = tenantRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + id));
        
        activityLogService.log(null, tenant.getId(), "TENANT_DELETED", 
            "Tenant deleted: " + tenant.getName());
        
        tenantRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public boolean isSubscriptionActive(UUID tenantId) {
        return tenantRepository.findById(tenantId)
            .map(tenant -> {
                if (tenant.getSubscriptionExpiresAt() == null) {
                    return true; // No expiry date means perpetual
                }
                return tenant.getSubscriptionExpiresAt().isAfter(LocalDateTime.now().toLocalDate());
            })
            .orElse(false);
    }
}
