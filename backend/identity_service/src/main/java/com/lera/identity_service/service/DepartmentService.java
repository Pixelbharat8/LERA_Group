package com.lera.identity_service.service;

import com.lera.identity_service.entity.Department;
import com.lera.identity_service.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DepartmentService {
    
    private final DepartmentRepository departmentRepository;
    
    /**
     * Get all departments
     */
    public List<Department> getAllDepartments() {
        log.info("Fetching all departments");
        return departmentRepository.findAll();
    }
    
    /**
     * Get all active departments
     */
    public List<Department> getAllActiveDepartments() {
        log.info("Fetching all active departments");
        return departmentRepository.findAllActive();
    }
    
    /**
     * Get department by ID
     */
    public Department getDepartmentById(UUID id) {
        log.info("Fetching department with id: {}", id);
        return departmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Department not found with id: " + id));
    }
    
    /**
     * Get department by code
     */
    public Department getDepartmentByCode(String code) {
        log.info("Fetching department with code: {}", code);
        return departmentRepository.findByDepartmentCode(code)
            .orElseThrow(() -> new RuntimeException("Department not found with code: " + code));
    }
    
    /**
     * Get departments by center
     */
    public List<Department> getDepartmentsByCenter(UUID centerId) {
        log.info("Fetching departments for center: {}", centerId);
        return departmentRepository.findByCenterId(centerId);
    }
    
    /**
     * Get departments by type
     */
    public List<Department> getDepartmentsByType(String type) {
        log.info("Fetching departments of type: {}", type);
        return departmentRepository.findByDepartmentType(type);
    }
    
    /**
     * Get departments by office type
     */
    public List<Department> getDepartmentsByOfficeType(String officeType) {
        log.info("Fetching departments for office type: {}", officeType);
        return departmentRepository.findByOfficeType(officeType);
    }
    
    /**
     * Get departments by center and office type
     */
    public List<Department> getDepartmentsByCenterAndOfficeType(UUID centerId, String officeType) {
        log.info("Fetching departments for center: {} and office type: {}", centerId, officeType);
        return departmentRepository.findByCenterIdAndOfficeType(centerId, officeType);
    }
    
    /**
     * Get departments by center and type
     */
    public List<Department> getDepartmentsByCenterAndType(UUID centerId, String type) {
        log.info("Fetching departments for center: {} and type: {}", centerId, type);
        return departmentRepository.findByCenterIdAndType(centerId, type);
    }
    
    /**
     * Get sub-departments (children) of a parent department
     */
    public List<Department> getSubDepartments(UUID parentDepartmentId) {
        log.info("Fetching sub-departments for parent: {}", parentDepartmentId);
        return departmentRepository.findByParentDepartmentId(parentDepartmentId);
    }
    
    /**
     * Get employee count in department
     */
    public Long getEmployeeCount(UUID departmentId) {
        log.info("Counting employees for department (fallback by center) : {}", departmentId);
        Department department = getDepartmentById(departmentId);
        if (department.getCenterId() == null) {
            return 0L;
        }
        return departmentRepository.countEmployeesInCenter(department.getCenterId());
    }
    
    /**
     * Create a new department
     */
    @Transactional
    public Department createDepartment(Department department) {
        log.info("Creating new department: {}", department.getDepartmentName());
        
        // Validate department code is unique
        departmentRepository.findByDepartmentCode(department.getDepartmentCode())
            .ifPresent(d -> {
                throw new RuntimeException("Department code already exists: " + department.getDepartmentCode());
            });
        
        // Set default values
        if (department.getStatus() == null) {
            department.setStatus("ACTIVE");
        }
        
        return departmentRepository.save(department);
    }
    
    /**
     * Update an existing department
     */
    @Transactional
    public Department updateDepartment(UUID id, Department departmentDetails) {
        log.info("Updating department with id: {}", id);
        
        Department existingDepartment = getDepartmentById(id);
        
        // Update fields
        if (departmentDetails.getDepartmentName() != null) {
            existingDepartment.setDepartmentName(departmentDetails.getDepartmentName());
        }
        if (departmentDetails.getDepartmentNameVi() != null) {
            existingDepartment.setDepartmentNameVi(departmentDetails.getDepartmentNameVi());
        }
        if (departmentDetails.getDepartmentType() != null) {
            existingDepartment.setDepartmentType(departmentDetails.getDepartmentType());
        }
        if (departmentDetails.getOfficeType() != null) {
            existingDepartment.setOfficeType(departmentDetails.getOfficeType());
        }
        if (departmentDetails.getCenterId() != null) {
            existingDepartment.setCenterId(departmentDetails.getCenterId());
        }
        if (departmentDetails.getParentDepartmentId() != null) {
            existingDepartment.setParentDepartmentId(departmentDetails.getParentDepartmentId());
        }
        if (departmentDetails.getManagerId() != null) {
            existingDepartment.setManagerId(departmentDetails.getManagerId());
        }
        if (departmentDetails.getDescription() != null) {
            existingDepartment.setDescription(departmentDetails.getDescription());
        }
        if (departmentDetails.getStatus() != null) {
            existingDepartment.setStatus(departmentDetails.getStatus());
        }
        
        existingDepartment.setUpdatedAt(LocalDateTime.now());
        
        return departmentRepository.save(existingDepartment);
    }
    
    /**
     * Deactivate a department (soft delete)
     */
    @Transactional
    public Department deactivateDepartment(UUID id) {
        log.info("Deactivating department with id: {}", id);
        
        Department department = getDepartmentById(id);
        department.setStatus("INACTIVE");
        department.setUpdatedAt(LocalDateTime.now());
        
        return departmentRepository.save(department);
    }
    
    /**
     * Activate a department
     */
    @Transactional
    public Department activateDepartment(UUID id) {
        log.info("Activating department with id: {}", id);
        
        Department department = getDepartmentById(id);
        department.setStatus("ACTIVE");
        department.setUpdatedAt(LocalDateTime.now());
        
        return departmentRepository.save(department);
    }
    
    /**
     * Delete a department permanently
     */
    @Transactional
    public void deleteDepartment(UUID id) {
        log.info("Deleting department with id: {}", id);
        
        // Check if department has employees
        Long employeeCount = getEmployeeCount(id);
        if (employeeCount > 0) {
            throw new RuntimeException("Cannot delete department with " + employeeCount + " employees. Please reassign employees first.");
        }
        
        // Check if department has sub-departments
        List<Department> subDepartments = getSubDepartments(id);
        if (!subDepartments.isEmpty()) {
            throw new RuntimeException("Cannot delete department with " + subDepartments.size() + " sub-departments. Please remove or reassign sub-departments first.");
        }
        
        departmentRepository.deleteById(id);
    }
}
