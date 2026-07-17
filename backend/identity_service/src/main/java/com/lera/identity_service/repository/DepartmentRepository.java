package com.lera.identity_service.repository;

import com.lera.identity_service.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    
    // Find by center
    List<Department> findByCenterId(UUID centerId);
    
    // Find by department type
    List<Department> findByDepartmentType(String departmentType);
    
    // Find by office type
    List<Department> findByOfficeType(String officeType);
    
    // Find by status
    List<Department> findByStatus(String status);
    
    // Find by center and office type (for branches)
    List<Department> findByCenterIdAndOfficeType(UUID centerId, String officeType);
    
    // Find by department code
    Optional<Department> findByDepartmentCode(String departmentCode);
    
    // Find by parent department
    List<Department> findByParentDepartmentId(UUID parentDepartmentId);
    
    // Find active departments
    @Query("SELECT d FROM Department d WHERE d.status = 'ACTIVE'")
    List<Department> findAllActive();
    
    // Find departments by center and type
    @Query("SELECT d FROM Department d WHERE d.centerId = :centerId AND d.departmentType = :type AND d.status = 'ACTIVE'")
    List<Department> findByCenterIdAndType(UUID centerId, String type);
    
    // Count employees actually assigned to a department (User.departmentId exists now, so this is
    // a real per-department count — the old center-wide count reported the same number for every
    // department in a center).
    @Query("SELECT COUNT(u) FROM User u WHERE u.departmentId = :departmentId")
    Long countEmployeesInDepartment(UUID departmentId);
}
