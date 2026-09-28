# LERA Platform — Panel Features & Chairman-Controlled Feature Model

This is the authoritative feature list for every role panel, plus the model by which the
**Chairman controls which features each role/user gets** (add/remove a feature → the UI and the
backend follow for that user).

---

## 0. Chairman Feature-Control Model (the requirement)

**Goal:** The Chairman has a master **Feature Registry**. Each role gets a default set of features.
The Chairman can **add or remove any feature for a role or an individual user**, and the change is
honoured in **both** places:
- **Frontend** — the feature's sidebar item + page are hidden/shown for that user.
- **Backend** — the feature's API endpoints are allowed/denied for that user.

CHAIRMAN always keeps **full, ungateable access** to everything (god mode) — the Chairman can never
be locked out of a feature.

### What already exists (≈60–70% built)
| Capability | Status | Where |
|---|---|---|
| Per-user permission store (15 feature toggles + 6 service toggles, with audit `grantedBy/At`) | ✅ | `UserPermission` entity + `/api/user-permissions/**` (identity_service) |
| Chairman/admin grant/revoke per user | ✅ | `POST/PUT/DELETE /api/user-permissions/user/{id}`, UI `dashboard/superadmin/roles` (Users tab) |
| Role registry + role→permission mapping | ✅ | `Role`/`RolePermission`, `/api/roles/**`, UI `dashboard/chairman/roles` |
| Frontend permission context (loads per-user permissions) | ✅ | `app/context/PermissionContext.tsx`, `usePermissions()` |
| Backend endpoint authorization | ✅ | Spring `@PreAuthorize` on every controller |
| Feature-flags framework (global / per-tenant / per-user) | ⚠️ partial | `FeatureFlag` entity, `/api/feature-flags`, UI `dashboard/superadmin/feature-flags` |

### State of the requirement

Verified against the code on 2026-09-24. Two of the five items below were already built and
one was fixed today; the rest are genuinely outstanding.

1. **Sidebar honours a grant** — ✅ done (`e4e5f5c`). The Academy, Attendance, Exams and Finance
   sections used to read `isSuperAdmin && checkPermission(x)`. `checkPermission()` short-circuits
   to true for high-level admins, so the `isSuperAdmin` half decided the whole expression and no
   grant could widen anyone. They now open on `grantedOrAdmin(...)`, which is true only where an
   admin saved a per-user row switching that module on — a role default still reveals nothing.
   Platform Admin stays admin-only by design. Public Website, CRM, Chat Admin and Other Services
   are **not** grantable: they have no key in `UserPermission`, which is item 5 below.
2. **Page-level guards** — ❌ outstanding, and deliberately not done piecemeal. Only 5 dashboard
   pages call `usePermissions()`. Adding guards without item 5 would lock people out of pages they
   legitimately reach today, because there is no agreed list of which module each page belongs to.
3. **Chairman "Feature Management" screen** — ✅ already built:
   `frontend/app/dashboard/chairman/feature-management/page.tsx`, linked from the sidebar. It
   writes the real `/api/user-permissions/user/{id}` and sets an AI budget. It is per-user only;
   a Roles × Features matrix does not exist.
4. **`targetRoles` on FeatureFlag** — ❌ outstanding. `FeatureFlag` carries `targetTenants` and
   `targetUsers`; there is no role dimension, and no frontend reader.
5. **Registry of features** — ❌ outstanding. The 16 keys in `UserPermission` are the de-facto
   registry, duplicated across the entity, the DTO, the context and the editor's own list. Nav
   sections that have no key cannot be granted at all.

**Also fixed today (`e4e5f5c`), found while checking the above:** the permissions endpoint
answered 200 with a synthesised all-denied default when a user had no row, indistinguishable
from a real one, so the per-role defaults table never applied to anyone and a full revoke was
read as "never configured"; the AI Assistant entry asked for a key that does not exist; and the
context failed **open** on any thrown error, handing the full admin sidebar to whoever hit it.
`user_permissions` currently holds **zero rows**.

### Which toggles actually bite on the backend

The screen shows 22 switches. A subtractive per-user gate (`PermissionGateFilter`, one tailored
copy per service) reads the matching `user_permissions` column and returns 403 on an explicit
`false`. God-mode roles are never gated, and no row / null / true always allows.

| Toggle | Backend enforced | Where |
|---|---|---|
| Users & Roles, Settings | ✅ | identity_service |
| Students, Teachers, Classes | ✅ | academy_service |
| Attendance | ✅ | attendance_service |
| Payments / Finance | ✅ | payment_service |
| Payroll | ✅ | payroll_service |
| Communication, Documents | ✅ *(added `4db7a2e`)* | connect_service |
| AI Assistant | ✅ *(added `4db7a2e`)* | ai_gateway |
| Social Media | ✅ *(added `4db7a2e`)* | social_media_service |
| **Dashboard, Centers, Courses, Reports** | ❌ **no-op** | no gate maps these columns |
| **All 6 service toggles** (`*ServiceEnabled`) | ❌ **no-op** | stored and echoed by the controller; nothing reads them |

The ❌ rows are switches an admin can throw that change nothing on the API — the menu hides,
the endpoints keep serving. `centers_access` is a special case: `/api/centers` is governed by
`settings_access`, so the Centers toggle is inert while Settings silently covers it.

**The gates carry only the per-user layer where they were added.** The older gates also check a
role layer against granular codes in `role_permissions`; that table seeds 30 codes and none of
them cover communication, documents, AI or social media, so a role check for those modules would
match nothing and deny every caller.

> Implementation note: CHAIRMAN (and SUPER_ADMIN) must be excluded from every gate — always allowed.

---

## 1. Parent Panel  (`/dashboard/parent`)
**Scope:** self-service, scoped to the parent's **own children** (via `student_parents`; cross-family blocked → 403). Read-mostly with a few writes.

| Feature | Page | What it does |
|---|---|---|
| Dashboard | `/parent` | # children, avg attendance, upcoming fees, unread messages |
| My Children | `/parent/children` | Children list + grade snapshot |
| Grades | `/parent/grades` | Per-child exam results & averages |
| Attendance | `/parent/attendance` | Per-child attendance record + rate |
| Schedule | `/parent/schedule` | Child's class timetable |
| Payments | `/parent/payments` | Child's invoices + payment history |
| Permission Slips | `/parent/permission-slips` | View & **respond** to slips (trips/consent) |
| Communication | `/parent/communication` | Meetings, centre notifications, centre contact |
| Messages | `/parent/messages` | Chat with teachers/staff (LERA Connect) |
| Resources | `/parent/resources` | Parent-targeted articles |
| Profile | `/parent/profile` | View/edit account |

---

## 2. Student Panel  (`/dashboard/student`)
**Scope:** self-service, scoped to the student **themselves** (via `students.user_id`; others blocked → 403).

| Feature | Page | What it does |
|---|---|---|
| Dashboard | `/student` | Enrollments, assignments due, today's schedule |
| My Classes | `/student/classes` | Enrolled classes + assignments |
| Assignments | `/student/assignments` | Homework list & status |
| Grades | `/student/grades` | Own exam results & averages |
| Attendance | `/student/attendance` | Own attendance + % rate |
| Schedule | `/student/schedule` | Weekly timetable |
| Payments | `/student/payments` | Own invoices + pay history |
| Messages | `/student/messages` | Chat (LERA Connect) |
| Profile | `/student/profile` | View/edit account |

---

## 3. Teacher Panel  (`/dashboard/teacher`)
**Scope:** scoped to the teacher's **assigned classes**.

| Feature | Page | What it does |
|---|---|---|
| Dashboard | `/teacher` | Stats, quick actions, today's real sessions |
| My Classes | `/teacher/classes` | Per class: students, sessions, **materials** (lesson-plan files), real grades |
| Take Attendance | `/teacher/attendance` | Mark session attendance + recent-sessions history |
| Gradebook | `/teacher/gradebook` | Bulk grade entry for a class |
| Grades / Exams | `/teacher/grades` | Manage exams, assignments, enter grades |
| My Schedule | `/teacher/schedule` | Teaching schedule |
| Students | `/teacher/students` | Roster of taught students |
| Permission Slips | `/teacher/permission-slips` | Process student slips |
| Leave Requests | `/teacher/leave` | Apply for / track leave |
| Messages | `/teacher/messages` | Chat with parents |
| My Workspace | `/dashboard/self-service` | Own payslip (view/print), leave, attendance, announcements |
| Profile | `/teacher/profile` | Profile |

---

## 4. HR  (Recruitment · Staff · Payroll · Training)
**Scope:** people operations across the org/centre.

| Feature | Page | What it does |
|---|---|---|
| Recruitment | `/dashboard/recruitment` | Post job openings; applicant pipeline (Applied→Hired/Rejected) |
| Staff Directory & Tasks | `/dashboard/staff` (+ `/tasks`, `/calendar`) | Staff overview, task assignment, calendar |
| Payroll | `/dashboard/payroll` | Generate/track payroll (base, bonus, deductions, status) |
| Training | `/dashboard/training` | Sessions, registrations, **certifications** |
| Leave Approvals | `/dashboard/attendance/leave-approvals` | Approve/reject staff leave |
| Self-Service (each staff) | `/dashboard/self-service` | Payslip, leave application, attendance, announcements |

---

## 5. Manager — Center Manager / Academic Manager / Center Admin
**Scope:** a **single centre**'s operations.

| Feature | Page | What it does |
|---|---|---|
| Center Dashboard | `/centermanager` · `/center-admin` | Centre stats: students, teachers, classes, today's real schedule, pending attendance/leave |
| Students | `/centermanager/students` | Manage centre students |
| Teachers | `/centermanager/teachers` | Manage centre teachers |
| Classes | `/centermanager/classes` | Manage centre classes |
| Attendance + Approvals | `/center-admin/attendance` (+ `/approvals`) | Review/approve attendance |
| Parent Communications | `/centermanager/parent-communications` | Reach parents |
| **Academic Manager** | `/academicmanager` (+ classes/teachers/students/courses) | Academic oversight: classes, teachers, courses, avg attendance, upcoming exams |
| Profile | `/*/profile` | Profile |

---

## 6. Multi-Branch / Regional Manager  (`/dashboard/director`)
**Scope:** **several centres** (a region/division).

| Feature | Page | What it does |
|---|---|---|
| Regional Dashboard | `/director` | Region rollup: centres, students, staff, revenue |
| Centers | `/director/centers` | Manage assigned centres |
| Staff | `/director/staff` | Staff across the region |
| Analytics | `/director/analytics` | Multi-branch analytics |
| Reports | `/director/reports` | Regional reporting |
| Overview | `/director/overview` | Key regional metrics |
| Profile | `/director/profile` | Profile |

---

## 7. Marketing  (CRM · Social · Campaigns)
**Scope:** demand generation + brand + the public website.

| Feature | Page | What it does |
|---|---|---|
| CRM Dashboard | `/dashboard/crm` | Hot leads, work queue, conversions |
| Leads | `/crm/leads` (+ `/[id]`) | Manage prospects + interaction history |
| Work Queue | `/crm/work-queue` | Hot leads + overdue follow-ups |
| Follow-ups | `/crm/followups` | Track follow-up activities |
| Trials | `/crm/trials` | Trial bookings → conversion |
| Registrations | `/crm/registrations` | Completed registrations |
| Renewals | `/crm/renewals` | Retention/renewals |
| Communications | `/crm/communications` | Lead comms history |
| Analytics | `/crm/analytics` | Pipeline & conversion analytics |
| Automations | `/crm/automations` | Workflow triggers |
| Tags | `/crm/tags` | Lead tagging |
| Social Feed/Events | `/dashboard/social` | Community posts, events, achievements |
| Marketing Suite | `/chairman/marketing/*` | Analytics, ads & campaigns, content calendar, social-media mgmt, ROI |
| Website Content (CMS) | `/chairman/website-content/*` | Home/About/Courses/Contact/Leadership/Branding/Blog/Header/Footer/FAQ/Testimonials/Privacy/Terms/SEO |

---

## 8. CEO Panel  (`/dashboard/ceo`)
**Scope:** organisation-wide executive view (read/strategic).

| Feature | Page | What it does |
|---|---|---|
| Executive Dashboard | `/ceo` | Org revenue, centres, students, teachers, enrolments, growth |
| Financial Reports | `/ceo/finance` | Revenue/payments across all centres |
| All Centers | `/ceo/centers` | View all centres |
| Analytics | `/ceo/analytics` | System-wide analytics |
| Strategy | `/ceo/strategy` | Strategic plans/goals |
| Overview | `/ceo/overview` | KPI dashboard |
| Profile | `/ceo/profile` | Profile |

---

## 9. Chairman Panel  (`/dashboard/chairman`) — full control
**Scope:** **everything** (god mode). The Chairman owns the feature registry and all admin actions.

**Governance / People**
- Dashboard (tabs: users, approvals, centers, departments, courses, marketing, website, settings, audit)
- Users & Roles `/chairman/users` (+ `/[id]`) · Students `/chairman/students` · Approvals `/chairman/approvals`
- Centers `/chairman/centers` (+ `/[id]`) · Directors `/chairman/directors` · Departments `/chairman/departments`
- Org Structure `/chairman/org-structure` · **Roles & Permissions** `/chairman/roles` · Staff `/chairman/staff`
- Courses & Programs `/chairman/courses`

**Insight / Ops**
- Analytics `/chairman/analytics` (real KPIs) · Reports `/chairman/reports` · Support `/chairman/support` · Settings `/chairman/settings`

**Marketing** — `/chairman/marketing/{analytics, ads-campaigns, content-calendar, social-media, roi}`

**Website CMS** — `/chairman/website-content/{home, about, courses, contact, leadership, branding, blog, header, footer, centers, faq, testimonials, privacy, terms, seo, settings}`

**Feature Control (to build per §0)** — `Roles × Features` and `User × Features` toggle matrix that
writes to `/api/user-permissions` + `/api/roles/{id}/permissions`, so adding/removing a feature
updates that user's sidebar + page access and the backend authorization.

---

## Feature-code registry (UI ↔ backend shared keys)
Existing per-user permission keys (extend as features grow):
`dashboard, centers, users, students, teachers, classes, courses, attendance, payments, payroll,
reports, settings, ai_assistant, communication, documents` + service toggles
`academyServiceEnabled, paymentServiceEnabled, attendanceServiceEnabled, payrollServiceEnabled,
connectServiceEnabled, aiGatewayEnabled`.

Each new panel feature should map to one of these keys (or a new key added to the registry), so the
Chairman's toggle drives the same gate in the sidebar, the page guard, and the API `@PreAuthorize`.
