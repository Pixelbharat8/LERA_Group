# Connect → Academy: CRM lead convert & placement import

When staff convert a CRM lead and link an Academy student, **connect_service** calls **academy_service** to copy informal placement data from lead notes into `student_skill_levels`. This page lists the environment variables and how to verify the wire-up.

Spring property names and a compact env table: [`backend/connect_service/PLACEMENT_SYNC_ENV.md`](../../backend/connect_service/PLACEMENT_SYNC_ENV.md).

## Services and flow

1. Dashboard: `PUT /api/leads/{id}/convert` with optional JSON body `{ "studentId": "<uuid>" }` (routed to connect_service).
2. connect_service: parses `[placement] scoreOutOf16=…` in `Lead.notes` and `POST`s to Academy internal API.
3. Academy: `POST /api/internal/student-skill-levels/placement-record` (header `X-Internal-Key`).

Staff can re-run sync on an already-CONVERTED lead via `POST /api/leads/{id}/placement-sync` (body optional, defaults to `lead.convertedStudentId`); this is safe because Academy upserts by `(student_id, source_lead_id)`.

## connect_service

| Variable | Property | Purpose |
|----------|----------|---------|
| `LERA_ACADEMY_URL` | `lera.academy.base-url` | Base URL of academy_service (no trailing slash), e.g. `http://academy:8082` in Docker, `http://localhost:8082` locally. |
| `LERA_INTERNAL_API_KEY` | `lera.internal.api-key` | Shared secret; must **match** academy’s `lera.internal.api-key`. |

If the key is missing or the URL is wrong, the lead still converts to `CONVERTED`, but the JSON response includes `placementSync` with `success: false` and a reason such as `INTERNAL_KEY_MISSING`, `ACADEMY_HTTP_ERROR`, or `ACADEMY_UNREACHABLE`. Check connect logs for `placement_sync leadId=…`.

## academy_service

| Variable | Property | Purpose |
|----------|----------|---------|
| `LERA_INTERNAL_API_KEY` (or your stack’s equivalent) | `lera.internal.api-key` | Must match connect_service. Internal routes under `/api/internal/**` return 503 if the key is unset or equals the legacy literal `LERA_INTERNAL_SVC_KEY_2024` (which used to ship as a fallback default and is now refused by `InternalApiKeyValidator` under `spring.profiles.active=prod`). |

## CORS and mobile

The API gateway and connect CORS configuration must allow the same origins as the rest of the app (including `capacitor://localhost` for native shells). Do not lock CORS to web-only when testing mobile WebViews.

## Deduplication

Placement rows imported from a lead are upserted by `(student_id, source_lead_id)` in Academy. Re-converting the same lead with the same student updates the existing row instead of inserting a duplicate (see unique partial index on `student_skill_levels`).

In **production**, academy_service uses `spring.jpa.hibernate.ddl-auto=validate`, so the partial unique index must exist in the database. Enable Flyway for the `prod` profile ([backend/academy_service/src/main/resources/application-prod.properties](backend/academy_service/src/main/resources/application-prod.properties): `spring.flyway.enabled=true`) so migration `V20260503__student_skill_levels_source_lead.sql` applies before Hibernate validates. Local/dev often rely on `ddl-auto=update` without Flyway.

## Local smoke test

1. Set the same `LERA_INTERNAL_API_KEY` in both services; point `LERA_ACADEMY_URL` at a running academy instance.
2. Create a lead whose `notes` contain e.g. `[placement] scoreOutOf16=10/16; trackEn=Intermediate`.
3. Convert with a valid `studentId`. Response should include `placementSync.success: true` (if notes parse and Academy accepts).
