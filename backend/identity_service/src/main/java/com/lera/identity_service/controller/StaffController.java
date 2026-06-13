package com.lera.identity_service.controller;

import com.lera.identity_service.entity.User;
import com.lera.identity_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

/**
 * Staff Controller - provides CRUD operations for users with STAFF role
 * Staff are stored in the users table with role = 'STAFF'
 */
@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF','STUDENT','PARENT')")
public class StaffController {
    
    private final UserRepository userRepository;
    
    @GetMapping
    public ResponseEntity<List<User>> getAllStaff(Pageable pageable) {
        List<User> staff = userRepository.findByCenterIdAndRoleName(null, "STAFF");
        // If center-based query returns empty, try getting all users with STAFF role
        if (staff.isEmpty()) {
            staff = userRepository.findAll(pageable).getContent().stream()
                .filter(u -> u.getRole() != null && "STAFF".equalsIgnoreCase(u.getRole().getName()))
                .toList();
        }
        return ResponseEntity.ok(staff);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getStaffById(@PathVariable UUID id) {
        return userRepository.findById(id)
            .map(user -> {
                Map<String, Object> profile = new HashMap<>();
                profile.put("id", user.getId());
                profile.put("userId", user.getId());
                profile.put("staffCode", "STF-" + user.getId().toString().substring(0, 8).toUpperCase());
                profile.put("fullName", user.getFullname());
                profile.put("email", user.getEmail());
                profile.put("phone", user.getPhone());
                profile.put("jobTitle", user.getJobTitle());
                profile.put("department", user.getDepartment() != null ? user.getDepartment().getDepartmentName() : null);
                profile.put("departmentId", user.getDepartmentId());
                profile.put("centerId", user.getCenterId());
                profile.put("employmentType", user.getEmploymentType());
                profile.put("status", user.getStatus());
                profile.put("avatarUrl", user.getAvatarUrl());
                profile.put("reportsTo", user.getReportsTo());
                profile.put("createdAt", user.getCreatedAt());
                
                return ResponseEntity.ok(profile);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/center/{centerId}")
    public ResponseEntity<List<User>> getStaffByCenter(@PathVariable UUID centerId) {
        List<User> staff = userRepository.findByCenterIdAndRoleName(centerId, "STAFF");
        return ResponseEntity.ok(staff);
    }
    
    @GetMapping("/{id}/profile")
    public ResponseEntity<Map<String, Object>> getStaffProfile(@PathVariable UUID id) {
        return userRepository.findById(id)
            .map(user -> {
                Map<String, Object> profile = new HashMap<>();
                profile.put("user", user);
                profile.put("staffCode", "STF-" + user.getId().toString().substring(0, 8).toUpperCase());
                
                // Get reports count
                int reportsCount = userRepository.countByReportsTo(user.getId());
                profile.put("directReportsCount", reportsCount);
                
                return ResponseEntity.ok(profile);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    // Creating/editing/deleting staff (= user records) is admin-only.
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
    @PostMapping
    public ResponseEntity<User> createStaff(@Valid @RequestBody User staff) {
        staff.setStatus("ACTIVE");
        return ResponseEntity.ok(userRepository.save(staff));
    }
    
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<User> updateStaff(@PathVariable UUID id, @Valid @RequestBody User staffDetails) {
        return userRepository.findById(id)
            .map(staff -> {
                if (staffDetails.getFullname() != null) staff.setFullname(staffDetails.getFullname());
                if (staffDetails.getPhone() != null) staff.setPhone(staffDetails.getPhone());
                if (staffDetails.getJobTitle() != null) staff.setJobTitle(staffDetails.getJobTitle());
                if (staffDetails.getDepartmentId() != null) staff.setDepartmentId(staffDetails.getDepartmentId());
                if (staffDetails.getCenterId() != null) staff.setCenterId(staffDetails.getCenterId());
                if (staffDetails.getEmploymentType() != null) staff.setEmploymentType(staffDetails.getEmploymentType());
                if (staffDetails.getStatus() != null) staff.setStatus(staffDetails.getStatus());
                return ResponseEntity.ok(userRepository.save(staff));
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStaff(@PathVariable UUID id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
