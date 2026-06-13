# 🔐 Roles & Permissions System - Complete Implementation

## Overview

This document describes the complete roles and permissions system implementation for the LERA Group platform.

## Database Schema

### Tables Created/Updated

1. **`roles`** - System roles with hierarchy levels
2. **`permissions`** - Granular permission codes
3. **`role_permissions`** - Maps roles to permissions
4. **`user_roles`** - Maps users to roles (per center)
5. **`user_permissions`** - Direct user feature access (NEW)

### User Permissions Table Structure

```sql
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    dashboard_access BOOLEAN DEFAULT TRUE,
    centers_access BOOLEAN DEFAULT FALSE,
    users_access BOOLEAN DEFAULT FALSE,
    students_access BOOLEAN DEFAULT FALSE,
    teachers_access BOOLEAN DEFAULT FALSE,
    classes_access BOOLEAN DEFAULT FALSE,
    courses_access BOOLEAN DEFAULT FALSE,
    attendance_access BOOLEAN DEFAULT FALSE,
    payments_access BOOLEAN DEFAULT FALSE,
    payroll_access BOOLEAN DEFAULT FALSE,
    reports_access BOOLEAN DEFAULT FALSE,
    settings_access BOOLEAN DEFAULT FALSE,
    ai_assistant_access BOOLEAN DEFAULT FALSE,
    communication_access BOOLEAN DEFAULT FALSE,
    documents_access BOOLEAN DEFAULT FALSE,
    academy_service_enabled BOOLEAN DEFAULT TRUE,
    payment_service_enabled BOOLEAN DEFAULT TRUE,
    attendance_service_enabled BOOLEAN DEFAULT TRUE,
    payroll_service_enabled BOOLEAN DEFAULT TRUE,
    connect_service_enabled BOOLEAN DEFAULT TRUE,
    ai_gateway_enabled BOOLEAN DEFAULT TRUE,
    granted_by UUID,
    granted_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Default Roles & Hierarchy

| Role | Level | Description |
|------|-------|-------------|
| SUPERADMIN | 100 | Full system access |
| CHAIRMAN | 95 | Organization owner/chairman |
| CEO | 90 | Chief Executive Officer |
| DIRECTOR | 80 | Regional/Department Director |
| CENTER_ADMIN | 70 | Center Administrator |
| MANAGER | 60 | Operations Manager |
| TEACHER | 50 | Teaching Staff |
| STUDENT | 30 | Student Access |
| PARENT | 20 | Parent/Guardian Access |

## Backend API Endpoints

### User Permissions Controller (`/api/user-permissions`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/user/{userId}` | Get user's permissions |
| POST | `/user/{userId}` | Set user's permissions |
| PUT | `/user/{userId}` | Update user's permissions |
| DELETE | `/user/{userId}/reset` | Reset to role defaults |
| GET | `/all` | Get all user permissions |

### Roles Controller (`/api/roles`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all roles |
| GET | `/{id}` | Get role by ID |
| POST | `/` | Create new role |
| PUT | `/{id}` | Update role |
| DELETE | `/{id}` | Delete role |
| GET | `/{id}/permissions` | Get role's permissions |
| PUT | `/{id}/permissions` | Update role's permissions |

### Permissions Controller (`/api/permissions`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all permissions |
| GET | `/grouped` | Get permissions grouped by module |
| GET | `/{id}` | Get permission by ID |
| POST | `/` | Create new permission |
| PUT | `/{id}` | Update permission |
| DELETE | `/{id}` | Delete permission |
| GET | `/modules` | Get list of modules |
| GET | `/module/{module}` | Get permissions by module |
| POST | `/bulk` | Bulk create permissions |

## Frontend Implementation

### Superadmin Roles Page (`/dashboard/superadmin/roles`)

**Features:**
- View all users with their roles
- Manage individual user permissions
- Search and filter by role
- Toggle specific feature access
- Save permissions to backend API
- Reset to role defaults

**Key Components:**
- User permissions table
- Permissions modal with toggle switches
- Role overview cards
- Default permissions matrix

### Chairman Roles Page (`/dashboard/chairman/roles`)

**Features:**
- Create/Edit/Delete roles
- Assign permissions to roles
- View role hierarchy
- Manage system vs custom roles

## Default Permissions by Role

| Feature | CHAIRMAN | CEO | DIRECTOR | CENTER_ADMIN | TEACHER | STUDENT |
|---------|----------|-----|----------|--------------|---------|---------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Centers | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Users | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Students | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Teachers | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Classes | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Courses | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Attendance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Payments | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Payroll | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Reports | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| AI Assistant | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Communication | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Documents | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Files Modified/Created

### Database
- `/database/init/init.sql` - Added `user_permissions` table
- `/database/migrations/V4__complete_roles_permissions.sql` - Created with seed data

### Backend (Identity Service)
- `/controller/PermissionController.java` - New permissions management API
- `/repository/PermissionRepository.java` - New permissions repository
- `/controller/UserPermissionController.java` - Already exists, unchanged

### Frontend
- `/app/dashboard/superadmin/roles/page.tsx` - Updated to use backend API

## How to Apply

1. **Run database migrations:**
   ```bash
   psql -U postgres -d lera_db -f /database/migrations/V4__complete_roles_permissions.sql
   ```

2. **Restart Identity Service:**
   ```bash
   cd backend/identity_service && mvn spring-boot:run
   ```

3. **Test the API:**
   ```bash
   # Get all permissions
   curl http://localhost:8081/api/permissions
   
   # Get all roles
   curl http://localhost:8081/api/roles
   
   # Get user permissions
   curl http://localhost:8081/api/user-permissions/user/{userId}
   ```

4. **Access frontend:**
   - Superadmin: `/dashboard/superadmin/roles`
   - Chairman: `/dashboard/chairman/roles`

## Testing Checklist

- [ ] Can view all users with their roles
- [ ] Can open permissions modal for a user
- [ ] Can toggle individual permissions
- [ ] Save button calls backend API
- [ ] Reset to defaults works
- [ ] Permissions persist after page refresh
- [ ] Can create new roles
- [ ] Can assign permissions to roles
- [ ] Role hierarchy is enforced

---

**Last Updated:** $(date)
**Author:** GitHub Copilot
