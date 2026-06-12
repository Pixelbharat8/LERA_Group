# 🏢 ORGANIZATIONAL HIERARCHY SYSTEM
## For Scaling to 50,000+ Users

### Date: December 26, 2025

---

## 📋 System Design Overview

### Purpose:
Create a clear organizational structure to manage 50,000+ users efficiently by categorizing them into:
- **Office Types**: Main Office vs. Branches
- **Departments**: Clear departmental organization
- **Sub-Categories**: Detailed role categorization

---

## 🏗️ Hierarchical Structure

```
Organization
├── Main Office (HQ)
│   ├── Academic Department
│   │   ├── Teachers
│   │   ├── Teaching Assistants (TA)
│   │   └── Department Head
│   ├── Administrative Department
│   │   ├── Staff (Admin)
│   │   ├── HR
│   │   └── Finance
│   ├── IT Department
│   └── Marketing Department
│
└── Branches (Multiple Locations)
    ├── Branch A - Lach Tray
    │   ├── Academic Department
    │   ├── Administrative
    │   └── Student Services
    ├── Branch B - Do Son
    └── Branch C - Location 3
```

---

## 🗂️ Database Schema Changes

### 1. Create `departments` Table

```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_code VARCHAR(50) UNIQUE NOT NULL,
    department_name VARCHAR(200) NOT NULL,
    department_name_vi VARCHAR(200),
    department_type VARCHAR(50) NOT NULL, -- 'ACADEMIC', 'ADMINISTRATIVE', 'IT', 'MARKETING', 'HR', 'FINANCE', 'OPERATIONS'
    parent_department_id UUID REFERENCES departments(id),
    center_id UUID REFERENCES centers(id),
    office_type VARCHAR(50) NOT NULL, -- 'MAIN_OFFICE', 'BRANCH'
    manager_id UUID REFERENCES users(id),
    description TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_departments_center ON departments(center_id);
CREATE INDEX idx_departments_type ON departments(department_type);
CREATE INDEX idx_departments_office_type ON departments(office_type);
```

### 2. Update `users` Table

```sql
ALTER TABLE users ADD COLUMN department_id UUID REFERENCES departments(id);
ALTER TABLE users ADD COLUMN office_type VARCHAR(50) DEFAULT 'BRANCH'; -- 'MAIN_OFFICE', 'BRANCH'
ALTER TABLE users ADD COLUMN employee_code VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN job_title VARCHAR(200);
ALTER TABLE users ADD COLUMN reports_to UUID REFERENCES users(id); -- Manager/Supervisor

CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_office_type ON users(office_type);
CREATE INDEX idx_users_employee_code ON users(employee_code);
```

### 3. Update `teachers` Table

```sql
ALTER TABLE teachers ADD COLUMN department_id UUID REFERENCES departments(id);
ALTER TABLE teachers ADD COLUMN office_type VARCHAR(50) DEFAULT 'BRANCH';
ALTER TABLE teachers ADD COLUMN employment_type VARCHAR(50); -- 'FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN'
ALTER TABLE teachers ADD COLUMN supervisor_id UUID REFERENCES teachers(id);

CREATE INDEX idx_teachers_department ON teachers(department_id);
CREATE INDEX idx_teachers_office_type ON teachers(office_type);
```

---

## 📊 Department Types & Categories

### Department Types:
1. **ACADEMIC** - Teaching & Education
   - Teachers
   - Teaching Assistants (TA)
   - Curriculum Developers
   - Academic Coordinators

2. **ADMINISTRATIVE** - General Admin
   - Admin Staff
   - Receptionists
   - Office Managers

3. **HR** - Human Resources
   - HR Managers
   - Recruiters
   - Training Coordinators

4. **FINANCE** - Financial Management
   - Accountants
   - Financial Controllers
   - Billing Specialists

5. **IT** - Information Technology
   - IT Support
   - System Administrators
   - Developers

6. **MARKETING** - Marketing & Sales
   - Marketing Managers
   - Content Creators
   - Sales Representatives

7. **OPERATIONS** - Operations Management
   - Operations Managers
   - Facility Managers
   - Logistics

8. **STUDENT_SERVICES** - Student Support
   - Counselors
   - Student Advisors
   - Support Staff

---

## 🎯 Implementation Steps

### Phase 1: Backend - Database & Entities ✅
1. Create Department entity
2. Update User entity
3. Update Teacher entity
4. Create Department repository
5. Create Department service
6. Create Department controller

### Phase 2: Backend - API Endpoints ✅
```
GET    /api/departments              # Get all departments
GET    /api/departments/{id}          # Get specific department
POST   /api/departments              # Create department
PUT    /api/departments/{id}          # Update department
DELETE /api/departments/{id}          # Delete department

GET    /api/departments/by-center/{centerId}  # Get departments by center
GET    /api/departments/by-type/{type}        # Get departments by type
GET    /api/departments/by-office/{officeType} # Get by office type
```

### Phase 3: Frontend - User Forms ✅
1. Update Add User form
2. Update Edit User form
3. Update Add Teacher form
4. Add Department dropdown
5. Add Office Type selector

### Phase 4: Frontend - Department Management ✅
1. Create Department Management page
2. Add CRUD operations
3. Add hierarchy visualization
4. Add employee count per department

---

## 📱 User Interface Changes

### Add User / Edit User Form - New Fields:

```tsx
// Office Type Selection
<div>
  <label>Office Type *</label>
  <select required>
    <option value="">Select Office Type</option>
    <option value="MAIN_OFFICE">🏢 Main Office (HQ)</option>
    <option value="BRANCH">🏪 Branch</option>
  </select>
</div>

// Center Selection (if Branch)
{officeType === 'BRANCH' && (
  <div>
    <label>Branch/Center *</label>
    <select required>
      <option value="">Select Branch</option>
      {centers.map(c => (
        <option value={c.id}>{c.name} - {c.city}</option>
      ))}
    </select>
  </div>
)}

// Department Selection
<div>
  <label>Department *</label>
  <select required>
    <option value="">Select Department</option>
    <optgroup label="Academic">
      <option value="TEACHING">Teaching Department</option>
      <option value="CURRICULUM">Curriculum Development</option>
    </optgroup>
    <optgroup label="Administrative">
      <option value="ADMIN">General Administration</option>
      <option value="HR">Human Resources</option>
      <option value="FINANCE">Finance & Accounting</option>
    </optgroup>
    <optgroup label="Operations">
      <option value="IT">IT & Technology</option>
      <option value="MARKETING">Marketing & Sales</option>
      <option value="OPERATIONS">Operations</option>
    </optgroup>
    <optgroup label="Student Services">
      <option value="STUDENT_SUPPORT">Student Support</option>
      <option value="COUNSELING">Counseling</option>
    </optgroup>
  </select>
</div>

// Job Title / Position
<div>
  <label>Job Title / Position</label>
  <input 
    type="text" 
    placeholder="e.g., Senior English Teacher, HR Manager"
  />
</div>

// Employee Code (Auto-generated or Manual)
<div>
  <label>Employee Code</label>
  <input 
    type="text" 
    placeholder="e.g., EMP-2025-001"
  />
  <small>Auto-generated if left blank</small>
</div>

// Reports To (Supervisor/Manager)
<div>
  <label>Reports To (Manager/Supervisor)</label>
  <select>
    <option value="">No Direct Manager</option>
    {managers.map(m => (
      <option value={m.id}>{m.fullname} - {m.jobTitle}</option>
    ))}
  </select>
</div>
```

---

## 🔍 Search & Filter Capabilities

### User List Filters:
```tsx
// Filter by Office Type
<select>
  <option value="">All Office Types</option>
  <option value="MAIN_OFFICE">Main Office Only</option>
  <option value="BRANCH">Branches Only</option>
</select>

// Filter by Department
<select>
  <option value="">All Departments</option>
  <option value="ACADEMIC">Academic</option>
  <option value="ADMINISTRATIVE">Administrative</option>
  <option value="HR">Human Resources</option>
  <option value="FINANCE">Finance</option>
  <option value="IT">IT</option>
  <option value="MARKETING">Marketing</option>
</select>

// Filter by Center (for Branches)
<select>
  <option value="">All Centers</option>
  {centers.map(c => <option value={c.id}>{c.name}</option>)}
</select>

// Filter by Role
<select>
  <option value="">All Roles</option>
  <option value="TEACHER">Teachers</option>
  <option value="TA">Teaching Assistants</option>
  <option value="STAFF">Staff</option>
</select>
```

---

## 📈 Benefits for 50,000+ Users

### 1. **Clear Organization**
- Easy to find users by department
- Clear reporting structure
- Simplified permission management

### 2. **Efficient Search**
- Filter by office type (Main/Branch)
- Filter by department
- Filter by center/location
- Combined filters for precise search

### 3. **Scalability**
- Indexed database columns for fast queries
- Hierarchical department structure
- Can add unlimited departments and sub-departments

### 4. **Better Management**
- Track employees per department
- Identify managers/supervisors
- Generate department-wise reports
- Analyze staffing levels

### 5. **Reporting & Analytics**
- Department-wise employee count
- Branch vs Main Office distribution
- Role distribution per department
- Hierarchy visualization

---

## 🚀 Next Steps

1. ✅ Review and approve database schema changes
2. ⏳ Implement Department entity (Backend)
3. ⏳ Create Department Management API
4. ⏳ Update User/Teacher forms (Frontend)
5. ⏳ Create Department Management UI
6. ⏳ Test with sample data
7. ⏳ Migration script for existing users
8. ⏳ Documentation and training

---

## 💡 Example Usage Scenarios

### Scenario 1: Adding a New Teacher
```
Name: John Smith
Email: john.smith@lera.com
Role: TEACHER
Office Type: BRANCH
Branch: Lach Tray Center
Department: Teaching Department - English
Job Title: Senior English Teacher
Reports To: Sarah Johnson (Academic Head)
Employee Code: TCH-2025-042
```

### Scenario 2: Adding Admin Staff
```
Name: Lisa Nguyen
Email: lisa.nguyen@lera.com
Role: STAFF
Office Type: MAIN_OFFICE
Department: Human Resources
Job Title: HR Manager
Reports To: Director of Operations
Employee Code: ADM-2025-015
```

### Scenario 3: Search Query
```
Find all:
- Teachers
- In Branch offices
- Teaching Department
- At Lach Tray Center
Result: Filtered list of 45 teachers
```

---

## ✅ Success Criteria

- [ ] Can create departments with hierarchy
- [ ] Can assign users to departments
- [ ] Can filter users by office type
- [ ] Can filter users by department
- [ ] Can search across 50,000+ users efficiently (< 1 second)
- [ ] Can generate department reports
- [ ] Clear reporting structure visible
- [ ] Auto-generate employee codes

---

**Ready to implement!** 🎯
