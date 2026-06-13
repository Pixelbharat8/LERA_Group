package com.lera.identity_service.service;

import com.lera.identity_service.entity.Role;
import com.lera.identity_service.entity.RolePermission;
import com.lera.identity_service.repository.RoleRepository;
import com.lera.identity_service.repository.RolePermissionRepository;
import com.lera.identity_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final UserRepository userRepository;

    @Cacheable("roles")
    public Page<Role> getAllRoles(Pageable pageable) {
        return roleRepository.findAll(pageable);
    }

    public Optional<Role> getRoleById(UUID id) {
        return roleRepository.findById(id);
    }

    public Optional<Role> getRoleByName(String name) {
        return roleRepository.findByName(name);
    }

    @CacheEvict(value = "roles", allEntries = true)
    @Transactional
    public Role createRole(Role role) {
        return roleRepository.save(role);
    }

    @CacheEvict(value = "roles", allEntries = true)
    @Transactional
    public Role updateRole(UUID id, Role roleDetails) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found"));
        if (roleDetails.getName() != null) role.setName(roleDetails.getName());
        if (roleDetails.getDisplayName() != null) role.setDisplayName(roleDetails.getDisplayName());
        if (roleDetails.getDescription() != null) role.setDescription(roleDetails.getDescription());
        return roleRepository.save(role);
    }

    @CacheEvict(value = "roles", allEntries = true)
    @Transactional
    public void deleteRole(UUID id) {
        roleRepository.deleteById(id);
    }

    public long getUserCountByRole(UUID roleId) {
        return userRepository.countByRoleId(roleId);
    }

    public List<RolePermission> getRolePermissions(UUID roleId) {
        return rolePermissionRepository.findByRoleId(roleId);
    }

    @Transactional
    public RolePermission addRolePermission(RolePermission rp) {
        return rolePermissionRepository.save(rp);
    }

    @Transactional
    public void removeRolePermission(UUID roleId, String permissionCode) {
        rolePermissionRepository.deleteByRoleIdAndPermissionCode(roleId, permissionCode);
    }

    @Transactional
    public void replaceRolePermissions(UUID roleId, List<RolePermission> permissions) {
        rolePermissionRepository.deleteByRoleId(roleId);
        rolePermissionRepository.saveAll(permissions);
    }
}
