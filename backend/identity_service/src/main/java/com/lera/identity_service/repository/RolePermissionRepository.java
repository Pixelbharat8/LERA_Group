package com.lera.identity_service.repository;

import com.lera.identity_service.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, UUID> {
    
    List<RolePermission> findByRoleId(UUID roleId);
    
    void deleteByRoleId(UUID roleId);
    
    void deleteByRoleIdAndPermissionCode(UUID roleId, String permissionCode);
    
    boolean existsByRoleIdAndPermissionCode(UUID roleId, String permissionCode);
}
