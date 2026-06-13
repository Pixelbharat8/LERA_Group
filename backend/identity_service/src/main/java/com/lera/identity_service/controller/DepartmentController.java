package com.lera.identity_service.controller;

import com.lera.identity_service.entity.Department;
import com.lera.identity_service.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
@Slf4j
public class DepartmentController {
    
    private final DepartmentService departmentService;
    
    /**
     * Get all departments
     * GET /api/departments
     */
    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments(
            @RequestParam(required = false) String status
    ) {
        log.info("GET /api/departments - status: {}", status);
        
        List<Department> departments;
        if ("ACTIVE".equalsIgnoreCase(status)) {
            departments = departmentService.getAllActiveDepartments();
        } else {
            departments = departmentService.getAllDepartments();
        }
        
        return ResponseEntity.ok(departments);
    }
    
    /**
     * Get department by ID
     * GET /api/departments/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Department> getDepartmentById(@PathVariable UUID id) {
        log.info("GET /api/departments/{}", id);
        
        try {
            Department department = departmentService.getDepartmentById(id);
            return ResponseEntity.ok(department);
        } catch (RuntimeException e) {
            log.error("Department not found: {}", id);
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Get department by code
     * GET /api/departments/code/{code}
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<Department> getDepartmentByCode(@PathVariable String code) {
        log.info("GET /api/departments/code/{}", code);
        
        try {
            Department department = departmentService.getDepartmentByCode(code);
            return ResponseEntity.ok(department);
        } catch (RuntimeException e) {
            log.error("Department not found with code: {}", code);
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Get departments by center
     * GET /api/departments/center/{centerId}
     */
    @GetMapping("/center/{centerId}")
    public ResponseEntity<List<Department>> getDepartmentsByCenter(@PathVariable UUID centerId) {
        log.info("GET /api/departments/center/{}", centerId);
        
        List<Department> departments = departmentService.getDepartmentsByCenter(centerId);
        return ResponseEntity.ok(departments);
    }
    
    /**
     * Get departments by type
     * GET /api/departments/type/{type}
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<Department>> getDepartmentsByType(@PathVariable String type) {
        log.info("GET /api/departments/type/{}", type);
        
        List<Department> departments = departmentService.getDepartmentsByType(type);
        return ResponseEntity.ok(departments);
    }
    
    /**
     * Get departments by office type
     * GET /api/departments/office-type/{officeType}
     */
    @GetMapping("/office-type/{officeType}")
    public ResponseEntity<List<Department>> getDepartmentsByOfficeType(@PathVariable String officeType) {
        log.info("GET /api/departments/office-type/{}", officeType);
        
        List<Department> departments = departmentService.getDepartmentsByOfficeType(officeType);
        return ResponseEntity.ok(departments);
    }
    
    /**
     * Get departments by center and office type
     * GET /api/departments/center/{centerId}/office-type/{officeType}
     */
    @GetMapping("/center/{centerId}/office-type/{officeType}")
    public ResponseEntity<List<Department>> getDepartmentsByCenterAndOfficeType(
            @PathVariable UUID centerId,
            @PathVariable String officeType
    ) {
        log.info("GET /api/departments/center/{}/office-type/{}", centerId, officeType);
        
        List<Department> departments = departmentService.getDepartmentsByCenterAndOfficeType(centerId, officeType);
        return ResponseEntity.ok(departments);
    }
    
    /**
     * Get departments by center and type
     * GET /api/departments/center/{centerId}/type/{type}
     */
    @GetMapping("/center/{centerId}/type/{type}")
    public ResponseEntity<List<Department>> getDepartmentsByCenterAndType(
            @PathVariable UUID centerId,
            @PathVariable String type
    ) {
        log.info("GET /api/departments/center/{}/type/{}", centerId, type);
        
        List<Department> departments = departmentService.getDepartmentsByCenterAndType(centerId, type);
        return ResponseEntity.ok(departments);
    }
    
    /**
     * Get sub-departments
     * GET /api/departments/{id}/sub-departments
     */
    @GetMapping("/{id}/sub-departments")
    public ResponseEntity<List<Department>> getSubDepartments(@PathVariable UUID id) {
        log.info("GET /api/departments/{}/sub-departments", id);
        
        List<Department> subDepartments = departmentService.getSubDepartments(id);
        return ResponseEntity.ok(subDepartments);
    }
    
    /**
     * Get employee count in department
     * GET /api/departments/{id}/employee-count
     */
    @GetMapping("/{id}/employee-count")
    public ResponseEntity<Map<String, Object>> getEmployeeCount(@PathVariable UUID id) {
        log.info("GET /api/departments/{}/employee-count", id);
        
        try {
            Long count = departmentService.getEmployeeCount(id);
            Map<String, Object> response = new HashMap<>();
            response.put("departmentId", id);
            response.put("employeeCount", count);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error getting employee count: {}", "An unexpected error occurred");
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Create a new department
     * POST /api/departments
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Map<String, Object>> createDepartment(@Valid @RequestBody Department department) {
        log.info("POST /api/departments - Creating: {}", department.getDepartmentName());
        
        try {
            Department createdDepartment = departmentService.createDepartment(department);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Department created successfully");
            response.put("department", createdDepartment);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            log.error("Error creating department: {}", "An unexpected error occurred");
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An unexpected error occurred");
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Update an existing department
     * PUT /api/departments/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Map<String, Object>> updateDepartment(
            @PathVariable UUID id,
            @Valid @RequestBody Department department
    ) {
        log.info("PUT /api/departments/{} - Updating", id);
        
        try {
            Department updatedDepartment = departmentService.updateDepartment(id, department);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Department updated successfully");
            response.put("department", updatedDepartment);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error updating department: {}", "An unexpected error occurred");
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An unexpected error occurred");
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Deactivate a department
     * POST /api/departments/{id}/deactivate
     */
    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Map<String, Object>> deactivateDepartment(@PathVariable UUID id) {
        log.info("POST /api/departments/{}/deactivate", id);
        
        try {
            Department department = departmentService.deactivateDepartment(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Department deactivated successfully");
            response.put("department", department);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error deactivating department: {}", "An unexpected error occurred");
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An unexpected error occurred");
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Activate a department
     * POST /api/departments/{id}/activate
     */
    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Map<String, Object>> activateDepartment(@PathVariable UUID id) {
        log.info("POST /api/departments/{}/activate", id);
        
        try {
            Department department = departmentService.activateDepartment(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Department activated successfully");
            response.put("department", department);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error activating department: {}", "An unexpected error occurred");
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An unexpected error occurred");
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Delete a department
     * DELETE /api/departments/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO')")
    public ResponseEntity<Map<String, Object>> deleteDepartment(@PathVariable UUID id) {
        log.info("DELETE /api/departments/{}", id);
        
        try {
            departmentService.deleteDepartment(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Department deleted successfully");
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error deleting department: {}", "An unexpected error occurred");
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An unexpected error occurred");
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}
