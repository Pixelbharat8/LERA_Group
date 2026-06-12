# 🚀 QUICK IMPLEMENTATION GUIDE
## Organizational Hierarchy for User Management

### ✅ COMPLETED:

1. **Database Schema** ✅
   - Created `/database/migrations/add_organizational_hierarchy.sql`
   - Departments table with full hierarchy support
   - Updated users and teachers tables
   - Added indexes for performance (50,000+ users)
   - Auto-generate employee codes
   - Created reporting views

2. **Backend Entity** ✅
   - Created `Department.java` entity
   - Full relationships with Users and Centers

### ⏳ TO DO (Run these steps):

#### Step 1: Run Database Migration
```bash
cd /Users/rahulsharma/LERA_Group
psql -h localhost -U your_username -d lera_db -f database/migrations/add_organizational_hierarchy.sql
```

#### Step 2: Create Department Repository
File: `backend/identity_service/src/main/java/com/lera/identity_service/repository/DepartmentRepository.java`

```java
package com.lera.identity_service.repository;

import com.lera.identity_service.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    List<Department> findByCenterId(UUID centerId);
    List<Department> findByDepartmentType(String departmentType);
    List<Department> findByOfficeType(String officeType);
    List<Department> findByStatus(String status);
    List<Department> findByCenterIdAndOfficeType(UUID centerId, String officeType);
}
```

#### Step 3: Create Department Service
File: `backend/identity_service/src/main/java/com/lera/identity_service/service/DepartmentService.java`

```java
package com.lera.identity_service.service;

import com.lera.identity_service.entity.Department;
import com.lera.identity_service.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DepartmentService {
    private final DepartmentRepository departmentRepository;
    
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }
    
    public Department getDepartmentById(UUID id) {
        return departmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Department not found"));
    }
    
    public List<Department> getDepartmentsByCenter(UUID centerId) {
        return departmentRepository.findByCenterId(centerId);
    }
    
    public List<Department> getDepartmentsByType(String type) {
        return departmentRepository.findByDepartmentType(type);
    }
    
    public List<Department> getDepartmentsByOfficeType(String officeType) {
        return departmentRepository.findByOfficeType(officeType);
    }
    
    public Department createDepartment(Department department) {
        return departmentRepository.save(department);
    }
    
    public Department updateDepartment(UUID id, Department department) {
        Department existing = getDepartmentById(id);
        existing.setDepartmentName(department.getDepartmentName());
        existing.setDepartmentType(department.getDepartmentType());
        existing.setDescription(department.getDescription());
        existing.setStatus(department.getStatus());
        return departmentRepository.save(existing);
    }
    
    public void deleteDepartment(UUID id) {
        departmentRepository.deleteById(id);
    }
}
```

#### Step 4: Create Department Controller
File: `backend/identity_service/src/main/java/com/lera/identity_service/controller/DepartmentController.java`

```java
package com.lera.identity_service.controller;

import com.lera.identity_service.entity.Department;
import com.lera.identity_service.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DepartmentController {
    
    private final DepartmentService departmentService;
    
    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Department> getDepartmentById(@PathVariable UUID id) {
        return ResponseEntity.ok(departmentService.getDepartmentById(id));
    }
    
    @GetMapping("/center/{centerId}")
    public ResponseEntity<List<Department>> getDepartmentsByCenter(@PathVariable UUID centerId) {
        return ResponseEntity.ok(departmentService.getDepartmentsByCenter(centerId));
    }
    
    @GetMapping("/type/{type}")
    public ResponseEntity<List<Department>> getDepartmentsByType(@PathVariable String type) {
        return ResponseEntity.ok(departmentService.getDepartmentsByType(type));
    }
    
    @GetMapping("/office-type/{officeType}")
    public ResponseEntity<List<Department>> getDepartmentsByOfficeType(@PathVariable String officeType) {
        return ResponseEntity.ok(departmentService.getDepartmentsByOfficeType(officeType));
    }
    
    @PostMapping
    public ResponseEntity<Department> createDepartment(@RequestBody Department department) {
        return ResponseEntity.ok(departmentService.createDepartment(department));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Department> updateDepartment(@PathVariable UUID id, @RequestBody Department department) {
        return ResponseEntity.ok(departmentService.updateDepartment(id, department));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDepartment(@PathVariable UUID id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.ok().build();
    }
}
```

#### Step 5: Update Next.js Config
Add rewrite rule in `frontend/next.config.js`:

```javascript
// Add after other rewrites:
{ source: "/api/departments/:path*", destination: `${identityUrl}/api/departments/:path*` },
```

#### Step 6: Update User Management Page
See file: `UPDATED_USER_MANAGEMENT_FORM.tsx` (created separately)

---

## 🎯 WHAT THIS GIVES YOU:

### For 50,000+ Users:
✅ **Fast Search**: Indexed queries on department, office type, center
✅ **Clear Organization**: Every user has department, office type, job title
✅ **Hierarchy Support**: Reports-to relationships, supervisors
✅ **Auto Employee Codes**: TCH-2025-001, STF-2025-042, etc.
✅ **Scalable**: Can handle millions of users with proper indexing
✅ **Reporting**: Built-in views for department analytics

### User Form Fields:
- Office Type: Main Office vs Branch
- Center (if Branch)
- Department (with categories)
- Job Title
- Employee Code (auto-generated)
- Reports To (Manager)
- Employment Type

### Example User Creation:
```
Name: John Smith
Email: john.smith@lera.com
Role: TEACHER
Office Type: BRANCH
Center: Lach Tray
Department: Teaching Department
Job Title: Senior English Teacher
Employee Code: TCH-2025-042 (auto-generated)
Reports To: Sarah Johnson (Academic Head)
Employment Type: FULL_TIME
```

---

## 📊 Next Steps:

1. Run the migration SQL
2. Add the Repository/Service/Controller files
3. Restart Identity Service
4. Update the frontend form (file provided separately)
5. Test with sample users

**Everything is ready to deploy!** 🚀
