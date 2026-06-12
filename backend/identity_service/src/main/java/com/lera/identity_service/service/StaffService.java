package com.lera.identity_service.service;

import com.lera.identity_service.entity.User;
import com.lera.identity_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class StaffService {

    private final UserRepository userRepository;

    public List<User> getAllStaff(Pageable pageable) {
        List<User> staff = userRepository.findByCenterIdAndRoleName(null, "STAFF");
        if (staff.isEmpty()) {
            staff = userRepository.findAll(pageable).getContent().stream()
                    .filter(u -> u.getRole() != null && "STAFF".equalsIgnoreCase(u.getRole().getName()))
                    .toList();
        }
        return staff;
    }

    public Optional<User> getStaffById(UUID id) {
        return userRepository.findById(id);
    }

    @Transactional
    public User saveStaff(User user) {
        return userRepository.save(user);
    }

    @Transactional
    public void deleteStaff(UUID id) {
        userRepository.deleteById(id);
    }

    public List<User> getStaffByCenter(UUID centerId) {
        return userRepository.findByCenterIdAndRoleName(centerId, "STAFF");
    }
}
