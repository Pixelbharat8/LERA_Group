package com.lera.identity_service.repository;

import com.lera.identity_service.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, UUID> {
    
    Optional<Permission> findByCode(String code);
    
    List<Permission> findByModule(String module);
    
    boolean existsByCode(String code);
    
    List<Permission> findByCodeIn(List<String> codes);
}
