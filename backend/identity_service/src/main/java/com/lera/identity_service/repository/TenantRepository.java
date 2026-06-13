package com.lera.identity_service.repository;

import com.lera.identity_service.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    
    Optional<Tenant> findByCode(String code);
    
    Optional<Tenant> findByDomain(String domain);
    
    Optional<Tenant> findBySubdomain(String subdomain);
    
    boolean existsByCode(String code);
}
