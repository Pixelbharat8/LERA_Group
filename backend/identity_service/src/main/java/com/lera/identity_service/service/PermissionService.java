package com.lera.identity_service.service;

import com.lera.identity_service.entity.Permission;
import com.lera.identity_service.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final PermissionRepository permissionRepository;

    @Cacheable("permissions")
    public Page<Permission> getAllPermissions(Pageable pageable) {
        return permissionRepository.findAll(pageable);
    }

    public Optional<Permission> getPermissionById(UUID id) {
        return permissionRepository.findById(id);
    }

    public Optional<Permission> getPermissionByCode(String code) {
        return permissionRepository.findByCode(code);
    }

    public List<Permission> getPermissionsByModule(String module) {
        return permissionRepository.findByModule(module);
    }

    public Map<String, List<Permission>> getPermissionsGrouped(Pageable pageable) {
        return permissionRepository.findAll(pageable).getContent().stream()
                .collect(Collectors.groupingBy(p -> p.getModule() != null ? p.getModule() : "other"));
    }

    @CacheEvict(value = "permissions", allEntries = true)
    @Transactional
    public Permission createPermission(Permission permission) {
        return permissionRepository.save(permission);
    }

    @CacheEvict(value = "permissions", allEntries = true)
    @Transactional
    public Permission updatePermission(UUID id, Permission details) {
        Permission p = permissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Permission not found"));
        if (details.getCode() != null) p.setCode(details.getCode());
        if (details.getName() != null) p.setName(details.getName());
        if (details.getModule() != null) p.setModule(details.getModule());
        if (details.getDescription() != null) p.setDescription(details.getDescription());
        return permissionRepository.save(p);
    }

    @CacheEvict(value = "permissions", allEntries = true)
    @Transactional
    public void deletePermission(UUID id) {
        permissionRepository.deleteById(id);
    }
}
