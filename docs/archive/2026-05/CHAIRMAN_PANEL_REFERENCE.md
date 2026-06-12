# 👑 Chairman Panel - Complete Reference

## Overview

The Chairman Panel provides executive-level access to all system functions for organization owners and top-level management. It includes **34 pages** across multiple functional areas.

## Panel Structure

### Main Pages (Root Level)

| Page | Lines | APIs Used | Description |
|------|-------|-----------|-------------|
| `page.tsx` | 746 | users, centers, courses, departments, roles | Main dashboard with tabs |
| `analytics/` | 421 | courses, payments, students, teachers | System analytics |
| `board/` | 589 | centers, departments, users | Board management |
| `centers/` | 326 | centers | Center management |
| `courses/` | 483 | courses | Course management |
| `departments/` | 361 | centers, departments | Department management |
| `directors/` | 766 | centers, departments, users, system-settings | Director management |
| `dropdown-options/` | 528 | system-settings | Dropdown configuration |
| `org-structure/` | 640 | centers, departments, users | Organization structure |
| `reports/` | 384 | reports | System reports |
| `roles/` | 471 | permissions, roles | Role management |
| `settings/` | 476 | system-settings | System settings |
| `staff/` | 774 | auth/register, centers, departments, users | Staff management |
| `support/` | 493 | faqs | Support/FAQ management |
| `users/` | 910 | auth/register, centers, departments, roles, users | User management |

### Marketing Module (`/marketing/*`)

| Page | Lines | APIs Used | Description |
|------|-------|-----------|-------------|
| `page.tsx` | 353 | marketing-campaigns, social-media-posts | Marketing overview |
| `social-media/` | 515 | cms-settings, social-platforms | Social media management |
| `ads-campaigns/` | 654 | ad-accounts, marketing-campaigns | Ad campaign management |
| `content-calendar/` | 578 | social-media-posts | Content calendar |
| `analytics/` | 406 | social-analytics, social-media-posts | Marketing analytics |

### Website Content Module (`/website-content/*`)

| Page | Lines | APIs Used | Description |
|------|-------|-----------|-------------|
| `page.tsx` | 299 | courses, testimonials | CMS overview |
| `header/` | 545 | cms-settings | Header/menu management |
| `home/` | 353 | cms-settings | Homepage content |
| `about/` | 300 | cms-settings | About page |
| `courses/` | 251 | courses | Courses page content |
| `centers/` | 254 | centers | Centers page content |
| `branding/` | 405 | cms-settings | Branding settings |
| `testimonials/` | 374 | testimonials | Testimonials management |
| `leadership/` | 360 | leadership-members | Leadership team |
| `faq/` | 372 | faqs | FAQ management |
| `contact/` | 231 | cms-settings | Contact page |
| `seo/` | 513 | cms-settings | SEO settings |
| `privacy/` | 278 | cms-settings | Privacy policy |
| `terms/` | 278 | cms-settings | Terms of service |

## Backend API Dependencies

### Identity Service (Port 8081)
- `/api/users` - User management
- `/api/roles` - Role management
- `/api/permissions` - Permission management
- `/api/user-permissions` - User permission management
- `/api/system-settings` - System settings
- `/api/departments` - Department management
- `/api/auth/*` - Authentication

### Academy Service (Port 8082)
- `/api/courses` - Course management
- `/api/centers` - Center management
- `/api/students` - Student management
- `/api/teachers` - Teacher management
- `/api/cms-settings` - CMS content settings
- `/api/testimonials` - Testimonials
- `/api/faqs` - FAQ management
- `/api/leadership-members` - Leadership team

### Connect Service (Port 8085)
- `/api/marketing-campaigns` - Marketing campaigns
- `/api/social-media-posts` - Social media posts
- `/api/social-platforms` - Social platform config
- `/api/social-analytics` - Social analytics
- `/api/ad-accounts` - Ad account management

### Payment Service (Port 8083)
- `/api/payments` - Payment data

## Key Features by Page

### Main Dashboard (`/dashboard/chairman`)
- Overview with quick stats
- User & role management
- Pending approvals
- Center overview
- Department management
- Course overview
- Marketing controls
- Website content access
- System settings
- Audit logs

### Users Management (`/dashboard/chairman/users`)
- Create/edit/delete users
- Role assignment
- Status management
- Password reset
- User search & filter
- Bulk operations

### Roles Management (`/dashboard/chairman/roles`)
- Create/edit/delete roles
- Permission assignment
- Role hierarchy
- System role protection

### Centers Management (`/dashboard/chairman/centers`)
- Create/edit/delete centers
- Center status
- Capacity management
- Location settings

### Marketing (`/dashboard/chairman/marketing/*`)
- Social media platform connection
- Post scheduling & publishing
- Ad campaign management
- Content calendar
- Marketing analytics
- ROI tracking

### Website Content (`/dashboard/chairman/website-content/*`)
- Header/menu management
- Homepage content
- About page
- Course listings
- Center information
- Testimonials
- Leadership team
- FAQ management
- SEO settings
- Privacy & Terms pages

## Access Control

The Chairman role has the highest privilege level (95) and can:
- ✅ Access all system features
- ✅ Manage all users including Directors
- ✅ Create/modify roles
- ✅ Configure system settings
- ✅ View all audit logs
- ✅ Manage marketing & website content
- ✅ Approve/reject requests
- ✅ Access all reports & analytics

## Total Statistics

- **Total Pages**: 34
- **Total Lines of Code**: ~15,000+
- **API Endpoints Used**: 25+
- **Backend Services**: 4 (Identity, Academy, Connect, Payment)

## No Errors Status

All 34 chairman panel pages have been verified with **no TypeScript errors**.

---

**Last Updated:** January 9, 2026
**Author:** GitHub Copilot
