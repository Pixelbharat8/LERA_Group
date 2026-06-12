package com.lera.identity_service.controller;

import com.lera.identity_service.dto.UserPermissionDTO;
import com.lera.identity_service.entity.UserPermission;
import com.lera.identity_service.repository.UserPermissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/user-permissions")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF','STUDENT','PARENT')")
public class UserPermissionController {

    @Autowired
    private UserPermissionRepository userPermissionRepository;

    @GetMapping("/user/{userId}")
    public ResponseEntity<UserPermissionDTO> getUserPermissions(@PathVariable UUID userId) {
        Optional<UserPermission> permission = userPermissionRepository.findByUserId(userId);
        
        if (permission.isPresent()) {
            return ResponseEntity.ok(convertToDTO(permission.get()));
        }
        
        UserPermissionDTO defaultPermissions = new UserPermissionDTO();
        defaultPermissions.setUserId(userId);
        defaultPermissions.setDashboard(true);
        defaultPermissions.setCenters(false);
        defaultPermissions.setUsers(false);
        defaultPermissions.setStudents(false);
        defaultPermissions.setTeachers(false);
        defaultPermissions.setClasses(false);
        defaultPermissions.setCourses(false);
        defaultPermissions.setAttendance(false);
        defaultPermissions.setPayments(false);
        defaultPermissions.setPayroll(false);
        defaultPermissions.setReports(false);
        defaultPermissions.setSettings(false);
        defaultPermissions.setAiAssistant(false);
        defaultPermissions.setCommunication(false);
        defaultPermissions.setDocuments(false);
        defaultPermissions.setAcademyServiceEnabled(true);
        defaultPermissions.setPaymentServiceEnabled(true);
        defaultPermissions.setAttendanceServiceEnabled(true);
        defaultPermissions.setPayrollServiceEnabled(true);
        defaultPermissions.setConnectServiceEnabled(true);
        defaultPermissions.setAiGatewayEnabled(true);
        
        return ResponseEntity.ok(defaultPermissions);
    }

    @PostMapping("/user/{userId}")
    public ResponseEntity<UserPermissionDTO> setUserPermissions(
            @PathVariable UUID userId,
            @Valid @RequestBody UserPermissionDTO dto) {
        
        UserPermission permission = userPermissionRepository.findByUserId(userId)
                .orElse(new UserPermission());
        
        permission.setUserId(userId);
        permission.setDashboard(dto.getDashboard() != null ? dto.getDashboard() : true);
        permission.setCenters(dto.getCenters() != null ? dto.getCenters() : false);
        permission.setUsers(dto.getUsers() != null ? dto.getUsers() : false);
        permission.setStudents(dto.getStudents() != null ? dto.getStudents() : false);
        permission.setTeachers(dto.getTeachers() != null ? dto.getTeachers() : false);
        permission.setClasses(dto.getClasses() != null ? dto.getClasses() : false);
        permission.setCourses(dto.getCourses() != null ? dto.getCourses() : false);
        permission.setAttendance(dto.getAttendance() != null ? dto.getAttendance() : false);
        permission.setPayments(dto.getPayments() != null ? dto.getPayments() : false);
        permission.setPayroll(dto.getPayroll() != null ? dto.getPayroll() : false);
        permission.setReports(dto.getReports() != null ? dto.getReports() : false);
        permission.setSettings(dto.getSettings() != null ? dto.getSettings() : false);
        permission.setAiAssistant(dto.getAiAssistant() != null ? dto.getAiAssistant() : false);
        permission.setCommunication(dto.getCommunication() != null ? dto.getCommunication() : false);
        permission.setDocuments(dto.getDocuments() != null ? dto.getDocuments() : false);
        permission.setAcademyServiceEnabled(dto.getAcademyServiceEnabled() != null ? dto.getAcademyServiceEnabled() : true);
        permission.setPaymentServiceEnabled(dto.getPaymentServiceEnabled() != null ? dto.getPaymentServiceEnabled() : true);
        permission.setAttendanceServiceEnabled(dto.getAttendanceServiceEnabled() != null ? dto.getAttendanceServiceEnabled() : true);
        permission.setPayrollServiceEnabled(dto.getPayrollServiceEnabled() != null ? dto.getPayrollServiceEnabled() : true);
        permission.setConnectServiceEnabled(dto.getConnectServiceEnabled() != null ? dto.getConnectServiceEnabled() : true);
        permission.setAiGatewayEnabled(dto.getAiGatewayEnabled() != null ? dto.getAiGatewayEnabled() : true);
        permission.setGrantedBy(dto.getGrantedBy());
        permission.setUpdatedBy(dto.getUpdatedBy());
        permission.setUpdatedAt(LocalDateTime.now());
        
        if (permission.getCreatedAt() == null) {
            permission.setCreatedAt(LocalDateTime.now());
        }
        
        UserPermission saved = userPermissionRepository.save(permission);
        return ResponseEntity.ok(convertToDTO(saved));
    }

    @PutMapping("/user/{userId}")
    public ResponseEntity<UserPermissionDTO> updateUserPermissions(
            @PathVariable UUID userId,
            @Valid @RequestBody Map<String, Object> permissions) {
        
        UserPermission permission = userPermissionRepository.findByUserId(userId)
                .orElse(new UserPermission());
        
        permission.setUserId(userId);
        
        if (permissions.containsKey("dashboard")) permission.setDashboard((Boolean) permissions.get("dashboard"));
        if (permissions.containsKey("centers")) permission.setCenters((Boolean) permissions.get("centers"));
        if (permissions.containsKey("users")) permission.setUsers((Boolean) permissions.get("users"));
        if (permissions.containsKey("students")) permission.setStudents((Boolean) permissions.get("students"));
        if (permissions.containsKey("teachers")) permission.setTeachers((Boolean) permissions.get("teachers"));
        if (permissions.containsKey("classes")) permission.setClasses((Boolean) permissions.get("classes"));
        if (permissions.containsKey("courses")) permission.setCourses((Boolean) permissions.get("courses"));
        if (permissions.containsKey("attendance")) permission.setAttendance((Boolean) permissions.get("attendance"));
        if (permissions.containsKey("payments")) permission.setPayments((Boolean) permissions.get("payments"));
        if (permissions.containsKey("payroll")) permission.setPayroll((Boolean) permissions.get("payroll"));
        if (permissions.containsKey("reports")) permission.setReports((Boolean) permissions.get("reports"));
        if (permissions.containsKey("settings")) permission.setSettings((Boolean) permissions.get("settings"));
        if (permissions.containsKey("ai_assistant")) permission.setAiAssistant((Boolean) permissions.get("ai_assistant"));
        if (permissions.containsKey("communication")) permission.setCommunication((Boolean) permissions.get("communication"));
        if (permissions.containsKey("documents")) permission.setDocuments((Boolean) permissions.get("documents"));
        if (permissions.containsKey("academyServiceEnabled")) permission.setAcademyServiceEnabled((Boolean) permissions.get("academyServiceEnabled"));
        if (permissions.containsKey("paymentServiceEnabled")) permission.setPaymentServiceEnabled((Boolean) permissions.get("paymentServiceEnabled"));
        if (permissions.containsKey("attendanceServiceEnabled")) permission.setAttendanceServiceEnabled((Boolean) permissions.get("attendanceServiceEnabled"));
        if (permissions.containsKey("payrollServiceEnabled")) permission.setPayrollServiceEnabled((Boolean) permissions.get("payrollServiceEnabled"));
        if (permissions.containsKey("connectServiceEnabled")) permission.setConnectServiceEnabled((Boolean) permissions.get("connectServiceEnabled"));
        if (permissions.containsKey("aiGatewayEnabled")) permission.setAiGatewayEnabled((Boolean) permissions.get("aiGatewayEnabled"));
        
        permission.setUpdatedAt(LocalDateTime.now());
        
        if (permission.getCreatedAt() == null) {
            permission.setCreatedAt(LocalDateTime.now());
        }
        
        UserPermission saved = userPermissionRepository.save(permission);
        return ResponseEntity.ok(convertToDTO(saved));
    }

    @DeleteMapping("/user/{userId}/reset")
    public ResponseEntity<Map<String, String>> resetUserPermissions(@PathVariable UUID userId) {
        Optional<UserPermission> permission = userPermissionRepository.findByUserId(userId);
        
        if (permission.isPresent()) {
            userPermissionRepository.delete(permission.get());
        }
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Permissions reset successfully");
        response.put("userId", userId.toString());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/all")
    public ResponseEntity<List<UserPermissionDTO>> getAllPermissions(Pageable pageable) {
        List<UserPermission> permissions = userPermissionRepository.findAll(pageable).getContent();
        List<UserPermissionDTO> dtos = new ArrayList<>();
        
        for (UserPermission p : permissions) {
            dtos.add(convertToDTO(p));
        }
        
        return ResponseEntity.ok(dtos);
    }

    private UserPermissionDTO convertToDTO(UserPermission entity) {
        UserPermissionDTO dto = new UserPermissionDTO();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setDashboard(entity.getDashboard());
        dto.setCenters(entity.getCenters());
        dto.setUsers(entity.getUsers());
        dto.setStudents(entity.getStudents());
        dto.setTeachers(entity.getTeachers());
        dto.setClasses(entity.getClasses());
        dto.setCourses(entity.getCourses());
        dto.setAttendance(entity.getAttendance());
        dto.setPayments(entity.getPayments());
        dto.setPayroll(entity.getPayroll());
        dto.setReports(entity.getReports());
        dto.setSettings(entity.getSettings());
        dto.setAiAssistant(entity.getAiAssistant());
        dto.setCommunication(entity.getCommunication());
        dto.setDocuments(entity.getDocuments());
        dto.setAcademyServiceEnabled(entity.getAcademyServiceEnabled());
        dto.setPaymentServiceEnabled(entity.getPaymentServiceEnabled());
        dto.setAttendanceServiceEnabled(entity.getAttendanceServiceEnabled());
        dto.setPayrollServiceEnabled(entity.getPayrollServiceEnabled());
        dto.setConnectServiceEnabled(entity.getConnectServiceEnabled());
        dto.setAiGatewayEnabled(entity.getAiGatewayEnabled());
        dto.setGrantedBy(entity.getGrantedBy());
        dto.setGrantedAt(entity.getGrantedAt());
        dto.setUpdatedBy(entity.getUpdatedBy());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
