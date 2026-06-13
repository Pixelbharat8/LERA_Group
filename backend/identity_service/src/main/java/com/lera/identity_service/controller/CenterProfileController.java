package com.lera.identity_service.controller;

import com.lera.identity_service.entity.*;
import com.lera.identity_service.repository.*;
import com.lera.identity_service.security.AccessGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/centers/{centerId}/profile")
@RequiredArgsConstructor
public class CenterProfileController {
    
    private final CenterRepository centerRepository;
    private final UserRepository userRepository;
    private final AccessGuard accessGuard;
    
    /**
     * Get comprehensive center profile with all data
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','TEACHER','STAFF','STUDENT','PARENT')")
    public ResponseEntity<Map<String, Object>> getCenterProfile(@PathVariable UUID centerId) {
        accessGuard.assertCenterAccess(centerId);
        return centerRepository.findById(centerId)
            .map(center -> {
                Map<String, Object> profile = new HashMap<>();
                profile.put("center", center);
                
                // Count users by role at this center
                long studentCount = userRepository.countByCenterIdAndRoleName(centerId, "STUDENT");
                long teacherCount = userRepository.countByCenterIdAndRoleName(centerId, "TEACHER");
                long staffCount = userRepository.countByCenterIdAndRoleName(centerId, "STAFF");
                long parentCount = userRepository.countByCenterIdAndRoleName(centerId, "PARENT");
                
                profile.put("studentCount", studentCount);
                profile.put("teacherCount", teacherCount);
                profile.put("staffCount", staffCount);
                profile.put("parentCount", parentCount);
                profile.put("totalUsers", studentCount + teacherCount + staffCount + parentCount);
                
                return ResponseEntity.ok(profile);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get users at this center by role (staff directory — not for anonymous parent/student roster scraping).
     */
    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','TEACHER','STAFF','TEACHING_ASSISTANT','TA')")
    public ResponseEntity<List<User>> getCenterUsers(
            @PathVariable UUID centerId,
            @RequestParam(required = false) String role) {
        accessGuard.assertCenterAccess(centerId);
        List<User> users;
        if (role != null && !role.isEmpty()) {
            users = userRepository.findByCenterIdAndRoleName(centerId, role);
        } else {
            users = userRepository.findByCenterId(centerId);
        }
        
        return ResponseEntity.ok(users);
    }
}
