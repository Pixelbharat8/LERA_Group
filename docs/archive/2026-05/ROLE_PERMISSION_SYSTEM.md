# 🔐 Role-Based Access Control (RBAC) System

## Overview

The LERA system implements a comprehensive **Role-Based Access Control (RBAC)** system that controls access at multiple levels:

1. **Route-Level Protection** - Layout files that check user roles before rendering pages
2. **Navigation Visibility** - Menu items shown/hidden based on permissions
3. **API-Level Permissions** - Backend validates permissions on API calls
4. **User-Specific Permissions** - Individual permission overrides per user

---

## 🏗️ Architecture

### 1. Frontend Permission Context
**File:** `/frontend/app/context/PermissionContext.tsx`

- Provides `hasPermission()` function globally
- Fetches user-specific permissions from API
- Falls back to role-based defaults

### 2. Route Protection Layouts
The following layouts enforce access control:

| Layout | Path | Allowed Roles |
|--------|------|---------------|
| Chairman Layout | `/dashboard/chairman/*` | CHAIRMAN, CEO, DIRECTOR, SUPER_ADMIN |
| CEO Layout | `/dashboard/ceo/*` | CHAIRMAN, CEO, SUPER_ADMIN |
| Director Layout | `/dashboard/director/*` | CHAIRMAN, CEO, DIRECTOR, SUPER_ADMIN |
| SuperAdmin Layout | `/dashboard/superadmin/*` | CHAIRMAN, CEO, DIRECTOR, SUPER_ADMIN |
| Finance Layout | `/dashboard/finance/*` | CHAIRMAN, CEO, DIRECTOR, SUPER_ADMIN, CENTER_MANAGER, ACCOUNTANT |
| Payroll Layout | `/dashboard/payroll/*` | CHAIRMAN, CEO, DIRECTOR, SUPER_ADMIN, CENTER_MANAGER, HR, ACCOUNTANT |
| Center Manager Layout | `/dashboard/centermanager/*` | CHAIRMAN, CEO, DIRECTOR, SUPER_ADMIN, CENTER_MANAGER |

### 3. Navigation Visibility
**File:** `/frontend/app/dashboard/layout.tsx`

The `checkPermission()` function controls menu visibility:
- High-level roles (CHAIRMAN, CEO, DIRECTOR, SUPER_ADMIN) see ALL menu items
- Other roles see menus based on their assigned permissions

---

## 👥 Role Hierarchy

```
CHAIRMAN (Highest Authority)
    └── Full system access
    └── Can modify ALL user permissions
    └── Can delete ANY data
    └── Approval authority over all

CEO
    └── Full system access (except chairman-only features)
    └── Can manage users/roles
    └── Financial oversight

DIRECTOR
    └── Department/Center oversight
    └── Can manage staff in their scope
    └── Reports access

SUPER_ADMIN / SUPERADMIN
    └── Technical admin access
    └── System configuration
    └── User management

CENTER_MANAGER
    └── Center-specific access only
    └── Can manage staff/students in their center
    └── Limited financial access

CENTER_ADMIN
    └── Academy operations
    └── Student/Teacher management
    └── No financial access

TEACHER
    └── Class management
    └── Attendance marking
    └── Student interaction

STUDENT
    └── Self-service dashboard
    └── View attendance/grades
    └── Communication access

PARENT
    └── View child's information
    └── Communication with teachers

STAFF
    └── Basic dashboard access
    └── Department-specific functions
```

---

## 🎛️ Available Permissions

Managed via Chairman Panel → Roles & Permissions:

### General
- `dashboard` - Dashboard Access

### User Management
- `users` - User Management
- `roles` - Role Management

### Organization
- `centers` - Center Management
- `departments` - Department Management

### Academy
- `students` - Student Management
- `teachers` - Teacher Management
- `courses` - Course Management
- `classes` - Class Management
- `classrooms` - Classroom Management
- `enrollments` - Enrollment Management

### Attendance
- `attendance` - Attendance Management
- `leave` - Leave Management

### Finance
- `payments` - Payment Management
- `payroll` - Payroll Management
- `invoices` - Invoice Management

### Marketing
- `marketing` - Marketing Access
- `marketing_campaigns` - Campaign Management
- `social_media` - Social Media Management
- `ad_accounts` - Ad Account Management
- `content_calendar` - Content Calendar
- `analytics_marketing` - Marketing Analytics

### Reports
- `reports` - Report Access
- `analytics` - Analytics Access

### CMS
- `website_content` - Website Content Management
- `seo_settings` - SEO Settings
- `public_pages` - Public Pages Editor

### System
- `settings` - System Settings
- `audit` - Audit Logs
- `ai_assistant` - AI Assistant
- `approvals` - Approval Authority

---

## 🔧 How to Manage Permissions

### As Chairman:
1. Go to **Chairman Panel → Roles & Permissions**
2. Click on any role to view/edit its permissions
3. Check/uncheck permissions for the role
4. Click "Save Permissions"

### For Individual Users:
1. Go to **Chairman Panel → Roles & Permissions**
2. Click "Manage Permissions" on a role
3. Select specific users from the role
4. Set custom permissions for those users
5. Save user-specific permissions

---

## 🛡️ Security Features

### Route Protection
- Every protected route checks user role on load
- Unauthorized users are redirected to their appropriate dashboard
- Loading states prevent flash of protected content

### Token Validation
- JWT token stored in cookies
- Role information verified on each page load
- Session timeout redirects to login

### API Security
- Backend validates token on every API call
- Role-based endpoint restrictions
- Audit logging of sensitive operations

---

## 📝 Default Role Permissions

When a new user is created, they get default permissions based on their role:

| Role | Default Permissions |
|------|---------------------|
| CHAIRMAN | ALL permissions |
| CEO | ALL permissions |
| SUPER_ADMIN | ALL permissions |
| DIRECTOR | All except settings, payroll |
| CENTER_ADMIN | Users, students, teachers, classes, courses, attendance, payments, reports, communication, documents |
| CENTER_MANAGER | ALL permissions (within their center) |
| TEACHER | Dashboard, students, classes, attendance, communication, documents |
| STUDENT | Dashboard, attendance, communication, documents |
| PARENT | Dashboard, attendance, communication |
| STAFF | Dashboard, attendance, communication, documents |

---

## 🚀 Implementation Status

| Feature | Status |
|---------|--------|
| Route-level protection layouts | ✅ Complete |
| Permission context | ✅ Complete |
| Navigation visibility controls | ✅ Complete |
| Chairman roles management page | ✅ Complete |
| User-specific permissions API | ✅ Complete |
| Role-based default permissions | ✅ Complete |
| Access denied pages | ✅ Complete |

---

## 📁 Related Files

- `/frontend/app/context/PermissionContext.tsx` - Permission context provider
- `/frontend/app/components/ProtectedRoute.tsx` - Reusable route protection component
- `/frontend/app/dashboard/layout.tsx` - Main dashboard layout with navigation controls
- `/frontend/app/dashboard/chairman/layout.tsx` - Chairman panel access control
- `/frontend/app/dashboard/ceo/layout.tsx` - CEO panel access control
- `/frontend/app/dashboard/director/layout.tsx` - Director panel access control
- `/frontend/app/dashboard/superadmin/layout.tsx` - SuperAdmin panel access control
- `/frontend/app/dashboard/finance/layout.tsx` - Finance panel access control
- `/frontend/app/dashboard/payroll/layout.tsx` - Payroll panel access control
- `/frontend/app/dashboard/centermanager/layout.tsx` - Center Manager panel access control
- `/frontend/app/dashboard/chairman/roles/page.tsx` - Role & Permission management UI
- `/backend/identity_service/src/main/java/com/lera/identity_service/controller/UserPermissionController.java` - Backend API

---

*Last Updated: $(date)*
