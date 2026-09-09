# LERA — Go-Live Checklist

## Current status (updated 2026-09-09)
Code is feature-complete and builds clean. `origin/main` is in sync at `233eb48`.

> **Correcting the previous entry.** This file claimed origin was in sync at `2a2ee72` from
> 2026-06-29 onward. It was not: `main` sat **182 commits ahead of origin for two months**
> (2026-06-30 → 2026-08-27), including the Java 25 upgrade and every security sweep. All of it
> lived only on one laptop, was never seen by CI, and was never backed up. Pushed 2026-09-07.
> Treat "in sync" claims here as needing `git rev-list --count origin/main..main` to confirm.

**Resolved since the last revision:**
- **CI was red on every run since at least 2026-06-29** — `aquasecurity/trivy-action@0.28.0` does
  not resolve (the tags are `v`-prefixed), so the job died in 3s at "Set up job" and the dependency
  CVE gate had **never once executed**. Fixed; it now runs.
- **Dependency CVEs**, surfaced the moment that gate worked: 1 CRITICAL (BouncyCastle
  CVE-2025-14813) + 2 HIGH (jose4j, PostgreSQL JDBC) in the backend, all patched; the frontend went
  from 14 npm advisories (11 high) to 0.
- **The prod profile could not boot.** Every service's `application-prod.properties` set
  `ddl-auto=validate` — see §3, which had asserted the opposite. Now `update`.
- **There was no compute layer at all** — the CloudFormation template built VPC/RDS/S3/CloudFront/WAF
  and nothing to run the code on. ECS Fargate added (see §3).
- **`aws/deploy-aws.sh` contained hard-coded production credentials** and deployed 1 of 9 services.
  Rewritten.
- **Public lead-form e2e tests were stale**, not broken code: the PDPD consent checkbox gates submit
  and the tests never ticked it. They had not run in CI in months because the frontend job dies at
  `npm audit`, which precedes Playwright.

Remaining blockers are **deploy / ops / legal execution** — they need your AWS + git credentials
and, per the jurisdiction question below, a decision only you can make.

---

## ⚠️ Decide first: which country hosts production?

Two mutually exclusive deployment paths are committed in this repo, and they put personal data in
different jurisdictions:

| Path | Artifacts | Data resides in |
|---|---|---|
| **AWS** | `aws/cloudformation-template.yaml`, `aws/deploy-aws.sh`, the CI `deploy` job | **us-east-1 (USA)** |
| **Vietnam VPS** | `docker-compose.https.yml`, `gateway/Caddyfile`, `DOMAIN` | **Vietnam** |

§6 Layer 3 of this document requires hosting the app **and** database inside Vietnam under the
Cybersecurity Law (Nghị định 53/2022), and notes that a foreign cloud may not satisfy it. **AWS has
no Vietnam region**, and the stack is pinned to us-east-1 because the WAFv2 WebACL is
`Scope=CLOUDFRONT`, which AWS only creates there. So the AWS path as built hosts Vietnamese
students' and parents' data — including minors' — in the United States.

These cannot both be right. Resolve this **before** deploying, with counsel:
- If Vietnam hosting is required → the VPS path is the compliant one; the AWS work is unused.
- If a foreign cloud is acceptable for your data volume/category → AWS is ready, but record the
  legal basis.
- A middle option exists (app + RDS in `ap-southeast-1` Singapore, WebACL alone in us-east-1) but
  Singapore is still not Vietnam and does not by itself satisfy localization.

Everything below assumes the AWS path, because that is what the templates automate.

**✅ Done & verified this round:**
- Flyway baselines deploy on a fresh DB — all 9 services dry-run clean (see 3a/3b).
- API returns correct status codes everywhere (404/400/405/415, no spurious 500s); regression test added.
- Frontend: 0 JS crashes across 323 routes; AI pages fixed; 0 dead nav links.
- **Backend test suite GREEN** on `main` (9/9 modules BUILD SUCCESS).

**📌 Tracked code debt (not launch-blocking):**
- `<html lang="en">` is static though the site is bilingual EN/VI.
- Minor: a few non-brand gradient accents (`#3b82f6`, `#1e3a8a`) and the `navy600`/`orange600`
  hover shades stay static (not exposed in the branding editor) — they don't follow the primary/
  secondary colour. Cosmetic only.

(Resolved 2026-06-29: branding is now fully wired & de-duped. Logo — Header/Footer read
`branding_logo_url` via `useBrandLogo`. Colours — the Tailwind `brand.navy`/`brand.orange`
tokens read `var(--brand-primary/secondary, <hex>)`, `BrandTheme` injects the configured
colours onto `<html>`, and the raw-hex usages were swept to the tokens; with nothing
configured the static palette renders unchanged. The orphaned `/superadmin/public-website/
branding` blob editor now redirects to the canonical `/chairman/website-content/branding`.)

(Resolved 2026-06-29: footer admin editor is now wired to the live `Footer.tsx` — it reads
`GET /api/cms-settings/value/footer_settings` and renders the Chairman's configured columns,
copyright and description, with a safe fallback to the built-in footer when no config is saved;
seed defaults corrected to real course slugs. SEO dynamic detail pages `/courses/[slug]` and
`/blog/[slug]` now have per-item `generateMetadata` + canonicals. The global SEO editor
(`seo_settings`) is now live — the root layout overlays its title/description/keywords/OG
image on the static defaults, with a safe fallback.)

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

> **Compute layer (added 2026-09-07).** Until then the template defined **no compute at all** — no
> ECS, EC2, Beanstalk or Lambda. It built a VPC, RDS, S3, CloudFront and a WAF, CI pushed images to
> Docker Hub, and nothing existed to run them; the deploy job's own notice said "roll out the pushed
> images on your compute layer", a layer that did not exist. The VPC also had an InternetGateway
> attached but **no route tables**, so nothing in it could route anywhere.
>
> Now added: an ECS Fargate cluster running all 11 tasks (9 services + Next.js frontend + nginx
> gateway), an ALB in front of the gateway only, Service Connect aliases that reproduce the
> docker-compose hostnames (`academy_service:8082`, …) so `gateway/nginx/*.conf` needs no changes,
> route tables + a NAT gateway, Secrets Manager for the three secrets, and CloudFront's default
> origin moved from S3 to the ALB (the frontend is server-rendered and a static S3 origin could
> never have served it). Structurally validated only — **never run against real AWS**.
>
> Rough cost: 11 Fargate tasks at 512 CPU / 1 GB (gateway 256/512) plus a NAT gateway is on the
> order of **$300–400/month before RDS**. `ServiceDesiredCount` defaults to 1, so there is no
> per-service redundancy at that price.
>
> `aws/deploy-aws.sh` now drives this stack and performs the §3a bootstrap automatically via the
> `FlywayEnabled` parameter.

```bash
# WAF WebACL is CLOUDFRONT scope -> deploy this stack in us-east-1
aws cloudformation deploy --template-file aws/cloudformation-template.yaml \
  --stack-name lera-prod --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides Environment=prod DBPassword=<new> JWTSecret=<new> \
                        DBInstanceClass=db.t3.small --region us-east-1
```
- Build & push images (CI `docker-build` job does this on `main`, or manually).
- **Prod runs Flyway with `ddl-auto=update`.** Flyway applies the overlay migrations, then Hibernate
  reconciles. The new migrations (`V20260606*`, `V20260607*` in academy + connect) must apply
  cleanly. Run a staging migration dry-run first.
  - **CORRECTION (2026-09-07).** This bullet previously read "this is the actual config in every
    service's `application.properties`; there is NO `validate` override." That was false and had
    been since 2026-06-06: `7ac96ce` added an `application-prod.properties` to all 9 services
    setting `ddl-auto=validate`, and the AWS path activates exactly that profile
    (`SPRING_PROFILES_ACTIVE=prod`). The claim held only for `application.properties`; nobody had
    checked the profile-specific file, because every verification in §3a/3b/3c was run under the
    **docker** profile. Booting academy under `prod` on an empty DB fails at
    `V999__replace_sports_with_english_courses.sql` → `relation "course_programs" does not exist`.
    All 9 prod profiles now say `update`, matching the verified requirement below.
  - **NOTE (verified 2026-07-04): `update` is REQUIRED, not just preferred — `validate` is
    architecturally incompatible.** Migration `V20260701__fix_library_transport_id_drift.sql` (and
    the same pattern elsewhere) deliberately `DROP`s empty type-drifted tables (e.g.
    `assignment_submissions`, library/transport tables) so that `ddl-auto=update` **recreates** them
    with the correct uuid/bigint types — Postgres can't auto-cast the old varchar/int columns. Under
    `validate` Hibernate never creates tables, so those dropped tables stay missing and the service
    fails at boot ("Schema-validation: missing table [assignment_submissions]" — reproduced on
    academy). So keep `ddl-auto=update` for prod. Under `update` all 9 services boot clean on the
    prod path (see 3a) with 0 schema-cast errors. Moving to `validate` later would first require
    removing the drop-and-recreate drift migrations and reconciling every entity to its migration.

#### ⚠️ 3a. First-deploy schema bootstrap (do NOT skip on an empty DB)
The Flyway migrations in every service are **incremental overlays** — indexes, constraints,
and feature tables added *on top of* a base schema. They do **not** create the base tables.
Each `V1__baseline.sql` says so verbatim: *"All existing tables are already created by
Hibernate ddl-auto=update."* No migration anywhere creates `users`, `payments`, `students`,
`leads`, `payrolls`, `attendance_records`, etc. — those come from `ddl-auto`.

Prod's config is `ddl-auto=update` + Flyway. **Flyway runs FIRST (before Hibernate) regardless of
the ddl-auto mode**, so on a **truly empty prod DB the first boot still fails** ("relation `users`
does not exist") — Flyway's overlays reference base tables that ddl-auto hasn't built yet.
(Confirmed 2026-07-04 by booting each service on a fresh empty DB under the docker profile: only
`payment` applies clean in isolation — its migrations are self-contained — every other service's
`V1__baseline` fails referencing not-yet-created tables.)

All 9 services share **one** database, and migrations reach **across** service boundaries
(e.g. identity's `V20260115__gap_fix_complete.sql` reads/writes `students`, which is
academy_service's table). So the bootstrap CANNOT be done one service at a time — the
**complete** shared schema must exist before **any** service runs `update`+Flyway.

**Required first-deploy sequence (one-time, on the empty prod DB) — two phases, all 9 together:**
1. **Phase 1 — build the full schema.** Boot **all 9** services with
   `SPRING_JPA_HIBERNATE_DDL_AUTO=update` **and** `SPRING_FLYWAY_ENABLED=false`. Each service's
   Hibernate creates its tables; together they form the complete shared schema. Wait until all
   report healthy, then stop them all.
2. **Phase 2 — migrate.** Restart **all 9** with the prod defaults (`ddl-auto=update`,
   `spring.flyway.enabled=true`). Flyway sees `baseline-on-migrate=true`, baselines the populated
   schema, applies V1+ overlays, and cross-service references resolve because Phase 1 built every
   table. Hibernate then reconciles. **Verified 2026-07-04** against a `pg_dump --schema-only` base:
   all 9 boot with 0 schema-cast errors (after fixing payment V192 `created_by` and the connect
   `assignment_submissions` table collision — see git log).
3. All **subsequent** deploys just run update+Flyway (incremental migrations apply normally).

Equivalent alternative: load a known-good `pg_dump --schema-only` of the dev schema into prod
first, then let update+Flyway adopt it. Either way the **full** schema must exist before the
first Flyway boot. (This `pg_dump --schema-only` base + docker-profile boot is exactly how the
2026-07-04 verification was run — all 9 services clean.)

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
Update 2026-07-04: the live boot was run locally — `pg_dump --schema-only` base → each of the 9
services booted under the docker profile (`ddl-auto=update` + Flyway) → all 9 apply Flyway + reach
health with 0 schema-cast errors (2 real blockers fixed along the way: payment V192 `created_by`
UUID, connect `assignment_submissions` table collision). Remaining gate is the same two-phase boot
(Phase 1 update+flyway-off, Phase 2 update+Flyway) on real staging infra to confirm ordering/Flyway
history on the target Postgres.

#### ✅ 3c. Entity-first two-boot verification — ALL 9 services (2026-07-08)
The schema-dump sim in 3b **cannot catch entity-vs-migration drift** (it reuses the live DB's
already-correct tables, so the divergent shape never appears). Ran the definitive test per service
on a throwaway DB: **boot 1** = `ddl-auto=update` + Flyway **off** (Hibernate builds the ENTITY-shaped
tables, exactly like dev / Phase-1) → **boot 2** = same DB, Flyway **on** (migrations run against the
entity-shaped tables, exactly like Phase-2 / a real deploy). This is the true prod bootstrap sequence.

Found + fixed **3 real deploy blockers** the sim had missed (all committed + re-verified clean):
- **academy `V20250115`** — seeds `form_configurations` (a JPA entity, `@GeneratedValue(UUID)` → no DB
  `id` default). The `CREATE TABLE IF NOT EXISTS` no-ops against the entity table and the seed INSERT
  omitted `id` → `null value in column "id"` → migration aborts. Fixed: INSERT now supplies
  `id = gen_random_uuid()` for all 6 rows.
- **ai_gateway `V1`** — indexed phantom `ai_tutor_sessions` (feature removed, no entity) →
  `relation "ai_tutor_sessions" does not exist` → migration aborts. Fixed: wrapped the indexes in a
  table-existence `DO` guard (self-heals if the feature returns).
- **attendance `AttendanceDataLoader`** (startup, not a migration) — ran `select count(*) from
  class_sessions` (an academy-owned table) at boot; on a fresh bootstrap attendance can start before
  academy creates it → `BadSqlGrammarException` crashes startup. Also seeded demo attendance with
  random student UUIDs. Fixed: skip seeding in deployed profiles (no fake data in prod) + check table
  existence before querying (no boot-order crash).

**Result: all 9 services build entities (boot 1) then apply every migration under Flyway (boot 2) →
0 failures, health UP.** payment (V192) + academy + ai_gateway + attendance carried fixes; identity,
connect, payroll, rule_engine, social_media were already clean. Method note: the entity-first two-boot
is the gate that catches this class — keep it in the staging dry-run (3b's sim is necessary but not
sufficient).

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
`Chairman@Leraacademy.edu.vn`=`Chairman@2026`, `teacher1@leraacademy.edu.vn`=`Teacher@2026`, plus a
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

## 🔐 6. Cybersecurity & Vietnam compliance

**Layer 1 — application security: ✅ DONE in code** (audited + hardened 2026-06/07). For reference:
JWT secret-strength enforced in prod · role + per-user (Chairman-controlled) authz enforced across
all 9 services · IDOR fixes (attendance, payment centre-scoping) · self-escalation blocked · rate
limiting on every service + a dedicated auth brute-force filter (identity) · CSP/HSTS/X-Frame
security headers on all 9 + frontend · XSS sanitized (DOMPurify) · open-redirect fixed · payment
amount server-derived + VNPay signature verified · **Swagger/API-docs disabled in docker+prod on
ALL 9 services** (2026-07-01) · secret tokens `@JsonProperty(WRITE_ONLY)`.

**Layer 2 — infra/network security (artifacts ready, ACTIVATE on deploy):**
- [ ] **Rotate secrets + scrub git history** (see §2) — old values are in history. Fresh strong
      values generated; put them in the server secrets store, never git. All prod vars are now in
      `.env.example` (seed passwords, VNPAY_*, `ACADEMY_SERVICE_URL`, `DOMAIN`, video).
- [ ] **TLS/HTTPS** live via `docker-compose.https.yml` + nginx (set `DOMAIN`); auto-renew certs.
- [ ] **WAF** in front (CloudFront WebACL, us-east-1 — see §3) or provider WAF.
- [ ] **Firewall**: expose only 80/443; DB/MinIO/pgadmin bound to the private network, never public.
- [ ] **Backups**: automated Postgres backups + restore test.
- [ ] **Monitoring/alerts** (see §4).
- [ ] **Penetration test** before real users.

**Layer 3 — Vietnam cyber-law / regulatory (LEGAL/OPERATIONAL — cannot be coded):**
- [x] **Data privacy (PDPD, Nghị định 13/2023)** — consent, cookie banner, bilingual privacy policy shipped.
- [ ] **Data localization (Cybersecurity Law, Nghị định 53/2022)** — host prod app **and DB inside
      Vietnam** (your PA Vietnam VPS satisfies this; a foreign cloud may not). Set `DB_HOST`/hosting accordingly.
- [ ] **Bộ Công Thương** e-commerce/website registration at **online.gov.vn** (display the đã thông báo logo).
- [ ] **A05 / MPS** notification if your personal-data volume/processing crosses the threshold — check with counsel.
- [ ] Appoint a data-protection contact; publish takedown/complaint channel.

---

## Quick go/no-go gate
- [ ] **Hosting jurisdiction decided** (see the callout at the top) — AWS us-east-1 vs Vietnam VPS
- [x] On `main`, code merged + pushed; backend test suite green — 503 tests, 9/9 modules (2026-09-07)
- [x] App-layer cybersecurity hardened; Swagger off on all 9 (2026-07-01)
- [x] CI dependency gate actually executes (trivy-action ref fixed) and is green (2026-09-07)
- [x] Prod profile boots — `ddl-auto` corrected from `validate` to `update` on all 9 (2026-09-07)
- [x] Compute layer exists (ECS Fargate) — **structurally validated, never deployed** (2026-09-07)
- [ ] CORS no longer trusts `http://localhost` in prod — PR open, not merged
- [ ] Next 15 upgrade (clears the last 4 npm advisories) — PR open, not merged
- [ ] `LERA_INTERNAL_API_KEY` + `DOCKER_USERNAME` set as repo secrets, or the deploy job self-skips
- [ ] Two-phase bootstrap rehearsed on a throwaway DB **before** the real first deploy
- [ ] Confirmed edited migrations were never applied in any env (checksum safety) + secrets rotated + history scrubbed
- [ ] Infra deployed (us-east-1 WAF); **first-deploy schema bootstrap done (step 3a)** then migrations applied on prod
- [ ] Logs + metrics + alerts live
- [ ] Test creds/data rotated; `LERA_SEED_*` set in prod
- [ ] SMTP configured; smoke-test a real login on the deployed URL
