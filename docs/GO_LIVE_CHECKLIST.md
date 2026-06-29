# LERA — Go-Live Checklist

## Current status (updated 2026-06-29)
Code is feature-complete, builds clean, and the recent hardening is **merged to `main` and
pushed** (origin in sync at `2a2ee72`). The remaining blockers are **deploy / ops / security
execution** — they need YOUR git + AWS credentials, so they can't be run from the dev assistant.

**✅ Done & verified this round:**
- Flyway baselines deploy on a fresh DB — all 9 services dry-run clean (see 3a/3b).
- API returns correct status codes everywhere (404/400/405/415, no spurious 500s); regression test added.
- Frontend: 0 JS crashes across 323 routes; AI pages fixed; 0 dead nav links.
- **Backend test suite GREEN** on `main` (9/9 modules BUILD SUCCESS).

**📌 Tracked code debt (not launch-blocking):**
- Footer admin editor's link columns aren't wired to the live (hardcoded) `Footer.tsx`.
- SEO: dynamic detail pages `/courses/[slug]` and `/blog/[slug]` lack per-item metadata, so each
  inherits its section's title + canonical. Needs `generateMetadata` (extract course data to a
  shared module; server-fetch the blog post by slug).
- `<html lang="en">` is static though the site is bilingual EN/VI.

(Resolved 2026-06-29: academy's 3 `@WebMvcTest` authz classes — un-quarantined via an H2-backed
JPA test harness; full backend suite now green with zero `@Disabled`.)

---

## ✅ 1. Get the code into main — DONE
Merged + pushed to `main` (`2a2ee72`); origin in sync. **Before deploying, confirm none of the
edited migrations (V192, V20260115, V20260122, the V1 baselines) were ever applied in any
environment** — they were edited, so a stale Flyway history would fail on a checksum mismatch.

**Verify:** `git log origin/main` shows the merge; CI green on `main`.

---

## 🔴 2. Rotate secrets + scrub git history
The old JWT/DB secrets are still in history. Tracked source is already clean (0 `lera123`).

```bash
# (a) rotate the live values first (generate strong ones)
openssl rand -base64 48   # JWT_SECRET (base64, >=32 bytes)
openssl rand -base64 24   # DB_PASSWORD / MINIO / pgAdmin / internal key
ALTER USER lera WITH PASSWORD '<new DB_PASSWORD>';   # on the prod DB

# (b) put them in the deploy secrets manager (NOT git): JWT_SECRET, DB_PASSWORD,
#     LERA_INTERNAL_API_KEY, MINIO_ROOT_*, PGADMIN_PASSWORD, LERA_SEED_*  (see .env.example)

# (c) scrub history (destructive, force-push — coordinate, everyone re-clones)
git clone --mirror <repo-url> lera-scrub && cd lera-scrub
CONFIRM=yes /path/to/repo/scripts/scrub-history.sh
git push --force --all && git push --force --tags
```
Full detail: `docs/SECURITY_SECRET_ROTATION_RUNBOOK.md`.

**Verify:** a service started in `prod` profile with `JWT_SECRET` unset fails fast; gitleaks CI green.

---

## 🔴 3. Deploy the hardened infrastructure + run migrations
The Multi-AZ/encrypted/WAF/port-locked CloudFormation is code only.

```bash
# WAF WebACL is CLOUDFRONT scope -> deploy this stack in us-east-1
aws cloudformation deploy --template-file aws/cloudformation-template.yaml \
  --stack-name lera-prod --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides Environment=prod DBPassword=<new> JWTSecret=<new> \
                        DBInstanceClass=db.t3.small --region us-east-1
```
- Build & push images (CI `docker-build` job does this on `main`, or manually).
- **Prod runs Flyway with `ddl-auto=validate`** — the new migrations
  (`V20260606*`, `V20260607*` in academy + connect) must apply cleanly. Run a staging
  migration dry-run first.

#### ⚠️ 3a. First-deploy schema bootstrap (do NOT skip on an empty DB)
The Flyway migrations in every service are **incremental overlays** — indexes, constraints,
and feature tables added *on top of* a base schema. They do **not** create the base tables.
Each `V1__baseline.sql` says so verbatim: *"All existing tables are already created by
Hibernate ddl-auto=update."* No migration anywhere creates `users`, `payments`, `students`,
`leads`, `payrolls`, `attendance_records`, etc. — those come from `ddl-auto`.

Prod's steady-state config is `ddl-auto=validate` + Flyway, which **validates** an existing
schema; it never creates the base tables. So on a **truly empty prod DB, the first boot
fails** ("relation `users` does not exist") — Flyway runs first and its overlays reference
tables that don't exist yet, and `validate` won't build them. (Confirmed via per-service
migration dry-run on a fresh schema: only `rule_engine` applies clean in isolation.)

All 9 services share **one** database, and migrations reach **across** service boundaries
(e.g. identity's `V20260115__gap_fix_complete.sql` reads/writes `students`, which is
academy_service's table). So the bootstrap CANNOT be done one service at a time — the
**complete** shared schema must exist before **any** service runs `validate`+Flyway.

**Required first-deploy sequence (one-time, on the empty prod DB) — two phases, all 9 together:**
1. **Phase 1 — build the full schema.** Boot **all 9** services with
   `SPRING_JPA_HIBERNATE_DDL_AUTO=update` **and** `SPRING_FLYWAY_ENABLED=false`. Each service's
   Hibernate creates its tables; together they form the complete shared schema. Wait until all
   report healthy, then stop them all.
2. **Phase 2 — migrate + validate.** Restart **all 9** with the prod defaults
   (`ddl-auto=validate`, `spring.flyway.enabled=true`). Flyway sees `baseline-on-migrate=true` /
   `baseline-version=0`, baselines the populated schema, applies V1+ overlays, and cross-service
   references resolve because Phase 1 built every table. `validate` then confirms entities match.
3. All **subsequent** deploys just run validate+Flyway (incremental migrations apply normally).

Equivalent alternative: load a known-good `pg_dump --schema-only` of the dev schema into prod
first, then let validate+Flyway adopt it. Either way the **full** schema must exist before the
first validate boot.

**This must be dry-run on an empty staging DB before prod** — verified 2026-06-28 with a
single-service fresh-DB test, which already surfaced real baseline bugs (now fixed):
- identity `V1__baseline.sql` indexed a non-existent `user_activities` table (the activity entity
  is `activity_logs`).
- payroll `V1__baseline.sql` indexed a non-existent `payrolls` table + `salary_structures` table
  and columns the real `payroll` entity lacks (`user_id`, `month`, `year`) — every line was wrong.
  Rewritten to the real tables/columns (`payroll(teacher_id, center_id, status, paid_at)`,
  `teacher_salary_config(teacher_id)`), validated on a throwaway DB.

A static column-level audit (index columns vs the ddl-auto schema) was run across **all** V1
baselines and resolved 2026-06-28. Real phantoms found and fixed:
- **connect** `V1__baseline.sql`: `leads(source)` → `leads(source_id)`; `tasks(assigned_to)` →
  `tasks(assignee_id)` (real column is `assignee_id`).
- **social** `V1__baseline.sql`: `social_analytics(platform_id)` → `(platform)`;
  `social_platforms(platform_type)` → `(platform_name)`; dropped `social_media_posts(platform_id)`
  (posts are multi-platform, no FK) and `social_analytics(post_id)` (per-platform/date aggregates,
  not per-post).
All corrected files were validated on a throwaway DB.

#### ✅ 3b. Phase-2 dry-run executed — all 9 services apply clean (2026-06-28)
The definitive gate was run as a **schema-dump simulation**: `pg_dump --schema-only` of the live
(entity/ddl-auto) DB → throwaway DB → every service's migrations applied in Flyway version order.
This caught a second, deeper class the static audits missed — **table-creating migrations whose
tables are ALSO ddl-auto entities, with a divergent column set** (the entity builds the table
first, so the migration's `CREATE TABLE IF NOT EXISTS` no-ops and later column refs fail). Fixed,
per "entities are source of truth":
- **payment `V192`** (18 failures): guarded every index/seed referencing entity-absent columns
  (`student_fee_plans.center_id/next_billing_date`, `invoices.invoice_date`, `discounts.type/status`,
  `refunds.refund_number/student_id/center_id`, `ledger_entries.student_id/entry_date/transaction_type`,
  `payment_methods.student_id`) via a `pg_temp.v192_idx` helper; guarded the `late_fee_rules` seed
  (entity uses `rule_name`, not `name`). The "partitioning" was already just comments.
- **attendance `V1`**: indexed `attendance_records` → real entity table is `attendance` (session-based:
  `session_id`/`check_in_time`, not `class_id`/`attendance_date`).
- **connect `V1`**: indexed `followups` → real entity table is `lead_followups`.
- **identity `V20260122`**: sample INSERT now supplies `created_at/updated_at` (entity col is NOT
  NULL, no default); guarded the `options` UPDATE (entity has no such column).
- **identity `V20260115`**: neutralized to a no-op — it was demo/seed data against an early schema
  (phantom `parents`/`staff`/`courses`/`attendance_records` tables, `exams.title`/`assignments.course_id`,
  `uuid_generate_v4()`), never run, useless on an empty prod DB, and undesirable (fake data) if it did.

**Result: a fresh `pg_dump` of the entity schema + all 9 services' migrations in order = 0 failures.**
Remaining gate is the live two-phase boot (Phase 1 ddl-auto, Phase 2 validate+Flyway) on real staging
infra — the SQL is now proven; that step confirms the runtime ordering/Flyway-history mechanics.

**Verify:** `aws cloudformation describe-stacks`; no app-service port open to `0.0.0.0/0`;
RDS shows Multi-AZ + encrypted.

---

## 🔴 4. Stand up monitoring + alerts
Metrics (`/actuator/prometheus`) and `traceId` logging are emitted but nothing collects them.

- Ship container logs to **CloudWatch Logs** (set the `awslogs`/json-file driver — compose has rotation).
- Scrape `/actuator/prometheus` with **Prometheus + Grafana** (or CloudWatch agent). Note the
  endpoint is auth-gated (401) — allow it on the internal network or scrape with a token.
- Alarms: RDS CPU/free-storage, 5xx rate, p95 latency, healthcheck failures.

**Verify:** a dashboard shows request rate/latency; killing a service fires an alert.

---

## 🔴 5. Reset test credentials + clean test data (before real users)
Created during this session in the **local dev** DB (NOT prod): passwords
`Chairman@Leraacademy.edu.vn`=`Chairman@2026`, `teacher1@lera.edu.vn`=`Teacher@2026`, plus a
few sample rows (1 training session, 1 perf review, 2 job openings, 1 hostel room, 1 product).

- **Prod is unaffected** — it seeds fresh via `LERA_SEED_*` env (set strong values there).
- For any shared/staging DB, rotate those passwords and delete the sample rows.

---

## 🟡 Should-do soon (not hard blockers)
- **Email**: set `SMTP_*` or password-reset / notification emails won't send.
- **Integrations**: Zalo OA / SMS provider, Facebook/Google API tokens for publishing + ad-spend.
- **Branch protection**: require the CI gates (gitleaks, npm audit, Trivy) on `main`.
- **Tests**: backend integration tests (Testcontainers) + JaCoCo; frontend test suite (currently 1).
- Public-site content polish + real photos.

---

## Quick go/no-go gate
- [x] On `main`, code merged + pushed; backend test suite green (2026-06-29)
- [ ] Confirmed edited migrations were never applied in any env (checksum safety) + secrets rotated + history scrubbed
- [ ] Infra deployed (us-east-1 WAF); **first-deploy schema bootstrap done (step 3a)** then migrations applied on prod
- [ ] Logs + metrics + alerts live
- [ ] Test creds/data rotated; `LERA_SEED_*` set in prod
- [ ] SMTP configured; smoke-test a real login on the deployed URL
