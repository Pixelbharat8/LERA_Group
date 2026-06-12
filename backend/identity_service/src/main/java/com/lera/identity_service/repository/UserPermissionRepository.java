package com.lera.identity_service.repository;

import com.lera.identity_service.entity.UserPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserPermissionRepository extends JpaRepository<UserPermission, UUID> {
    
    Optional<UserPermission> findByUserId(UUID userId);
    
    void deleteByUserId(UUID userId);
}
