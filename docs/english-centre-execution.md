# English centre plan — execution notes (vertical slice, ops, TODO triage)

This file records decisions for the “English centre” audit to-dos (do not edit the source plan in `.cursor/plans/`).

## 1. Vertical slice: **parent + student mobile MVP**

**Scope:** Tighten the path where families use the same web app in a phone WebView: **correct academy `student` identity for API calls**, **learner-safe assignment reads**, and **optional social service** for dev.

**In this slice:**

- `GET /api/students/self` — returns the `students` row for the logged-in user (`user_id` match), so the dashboard can use real `student_id` for enrollments, attendance, and assignments (identity UUID alone is not the academy primary key).
- Assignment APIs — authenticated **STUDENT** / **PARENT** users can list homework and assessments without `@PreAuthorize`-staff-only blocking; staff-only endpoints remain for catalogue-wide queries (`/class/…`, `/teacher/…`, `/type/…`, mutations).
- Frontend — student dashboard stats and “My assignments” call `/api/students/self` and `/api/assignments` accordingly.

**Deferred** (not in this slice): placement wizard, trial-lesson CRM automation, PDF reporting pack, transactional email hardening beyond existing mail config.

---

## 2. Ops / `start-all-services.sh`

- **Default cores:** Identity, Academy, Payment, Payroll, Attendance, Connect, AI Gateway, Rule Engine, Frontend (see script numbering).
- **Optional:** `social_media_service` on port **8089** — start only when needed:

  ```bash
  export LERA_START_SOCIAL_MEDIA=true
  ./start-all-services.sh
  ```

- **Portable root:** `PROJECT_ROOT` defaults to the directory containing this script; override with `LERA_PROJECT_ROOT` if you relocate the repo.

---

## 3. TODO triage (plan items: password reset, invoices, assignments)

| Area | Status | Notes |
|------|--------|--------|
| **Password reset email** | **OK when configured** | `AuthController` uses `PasswordResetMailService` + `JavaMailSender`. Configure `spring.mail.*` and `lera.mail.from` (or `spring.mail.username`). Non-prod logs a dev-only reset URL when mail is off; prod logs a warning without leaking links. |
| **Invoices / `parent_id`** | **Implemented** | `InvoiceController` accepts `parentId`; `InvoiceRepository.findByParentIdJoinStudents` joins `students.parent_id`. `InvoiceServiceImpl` resolves parent for paid notifications. |
| **Assignment list / roles** | **Fixed in this pass** | Learner and parent access was effectively blocked by class-level staff-only security; **TEACHER** / **TEACHING_ASSISTANT** / **TA** are aligned with `AcademyRoles` and `CurrentUser.isStaff()`. IDOR for `studentId` is handled via `AcademyAuthorizationService.assertCanViewStudent` where applicable. |

**Non-blocking repo TODOs:** `application.properties` comments in identity/ai_gateway about Flyway/EntityManagerFactory re-enable are infrastructure follow-ups, not English-centre product blockers.

---

## 4. Connect → Academy placement sync (CRM lead convert)

**Ops quick reference (env vars, troubleshooting):** [connect-academy-env.md](connect-academy-env.md).

When staff convert a CRM lead and optionally link an academy student, **connect_service** POSTs informal placement data to **academy_service** at:

`POST {lera.academy.base-url}/api/internal/student-skill-levels/placement-record`

Header: `X-Internal-Key: <shared secret>` (same value as academy’s `lera.internal.api-key`).

### Environment variables (deploy both sides consistently)

| Variable | Service | Purpose |
|----------|---------|---------|
| `LERA_ACADEMY_URL` | **connect_service** | Base URL for academy (no trailing slash). Docker Compose example: `http://academy:8082`. Kubernetes example: `http://academy-service:8082`. Local dev: `http://localhost:8082`. Mapped from `lera.academy.base-url` in `application.properties`. |
| `LERA_INTERNAL_API_KEY` | **connect_service** and **academy_service** | Shared secret for `/api/internal/**`. Must match on both services. If missing on academy, internal routes return **503**. If wrong on connect, convert still returns **200** but `placementSync` reports `ACADEMY_HTTP_ERROR` or similar; logs contain `placement_sync ...`. |

Operational signals:

- **Convert API:** `PUT /api/leads/{id}/convert` response includes `placementSync: { attempted, success, reason, detail }` so staff UIs can surface failures without guessing.
- **Audit:** `LEAD_CONVERTED` audit rows include `placementSync` summary in `new_values` JSON when audit logging succeeds.
- **Dedupe:** Academy stores `source_lead_id` on `student_skill_levels` and upserts by `(student_id, source_lead_id)` for lead imports (partial unique index where `source_lead_id` is not null).

Wrong `LERA_ACADEMY_URL` typically yields `placementSync.reason = ACADEMY_UNREACHABLE` (network / DNS). Fix routing first; key mismatches show as HTTP errors from academy.
