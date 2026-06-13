package com.lera.identity_service.service;

import com.lera.identity_service.entity.UserPermission;
import com.lera.identity_service.repository.UserPermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class UserPermissionService {

    private final UserPermissionRepository userPermissionRepository;

    public Optional<UserPermission> getByUserId(UUID userId) {
        return userPermissionRepository.findByUserId(userId);
    }

    public Optional<UserPermission> getById(UUID id) {
        return userPermissionRepository.findById(id);
    }

    @Transactional
    public UserPermission save(UserPermission userPermission) {
        return userPermissionRepository.save(userPermission);
    }

    @Transactional
    public void deleteByUserId(UUID userId) {
        userPermissionRepository.deleteByUserId(userId);
    }

    @Transactional
    public void deleteById(UUID id) {
        userPermissionRepository.deleteById(id);
    }
}
