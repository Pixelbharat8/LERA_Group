# CRM lead convert → Academy placement sync

For a narrative runbook (flow, CORS, smoke test), see [`../docs/ops/connect-academy-placement.md`](../docs/ops/connect-academy-placement.md).

When staff calls `PUT /api/leads/{id}/convert` with an optional `studentId`, **connect_service** POSTs informal placement data parsed from lead notes to **academy_service**:

`POST {LERA_ACADEMY_URL}/api/internal/student-skill-levels/placement-record`  
Header: `X-Internal-Key: <same secret as academy>`  
Body includes `sourceLeadId` so Academy can upsert one row per `(student, lead)` (partial unique index on `student_skill_levels`).

Re-import after the lead is already CONVERTED (typo fix, re-link, retry after Academy outage):

`POST /api/leads/{id}/placement-sync` with `{ "studentId": "<uuid>" }` (defaults to `lead.convertedStudentId`).
Returns the same `PlacementSyncResult` shape; safe to call repeatedly thanks to the upsert.

## Environment variables (connect_service)

| Variable | Purpose | Example |
|----------|---------|---------|
| `LERA_ACADEMY_URL` | Base URL of academy_service (no trailing slash). Must be reachable from connect’s network (Docker/K8s service DNS, not only `localhost` from inside a container). | `http://academy-service:8082` |
| `LERA_INTERNAL_API_KEY` | Shared secret; **must match** academy’s `lera.internal.api-key`. If unset/wrong, convert still returns 200 but `placementSync` reports `INTERNAL_KEY_MISSING` or `ACADEMY_HTTP_ERROR`. The legacy literal `LERA_INTERNAL_SVC_KEY_2024` (which used to ship as a fallback default) is now treated as "unset" by the filter, and `InternalApiKeyValidator` refuses to start under `spring.profiles.active=prod` with a blank or legacy value. | Strong random string |

Spring binds these in `application.properties`:

- `lera.academy.base-url=${LERA_ACADEMY_URL:http://localhost:8082}`
- `lera.internal.api-key=${LERA_INTERNAL_API_KEY:...}`

## Environment variables (academy_service)

| Property / env | Purpose |
|----------------|---------|
| `lera.internal.api-key` / `LERA_INTERNAL_API_KEY` | Validates `X-Internal-Key` on `/api/internal/**`. Must match connect. Internal routes return 503 if the key is unset or equals the legacy literal `LERA_INTERNAL_SVC_KEY_2024`. `InternalApiKeyValidator` refuses to start under `spring.profiles.active=prod` with a blank or legacy value. |

## Operations checklist

1. Set identical internal API key on both services in each environment.
2. Point `LERA_ACADEMY_URL` at the academy HTTP endpoint connect can reach (same cluster/VPC).
3. Wrong URL typically surfaces as `placementSync.reason = ACADEMY_UNREACHABLE` on convert; staff see the banner on the CRM leads UI.
4. Academy Flyway migration `V20260503__student_skill_levels_source_lead.sql` adds `source_lead_id` and a partial unique index for lead-import deduplication. With `spring.profiles.active=prod`, Flyway is enabled in [application-prod.properties](../academy_service/src/main/resources/application-prod.properties) so this migration applies before Hibernate `validate`.
5. When placement sync fails after an attempted call, `assignedTo` receives an in-app notification with EN + VI title/body (`CRM_PLACEMENT_SYNC`).

## Related tests

- `LeadPlacementNotesParserTest` — parses `[placement] scoreOutOf16=…` blocks in lead notes.
- `LeadPlacementSyncServiceTest` — RestTemplate behaviour toward Academy.
- `LeadControllerConvertTest` — convert response includes `placementSync`.
- `LeadControllerConvertMvcTest` — HTTP JSON contract for `PUT /api/leads/{id}/convert` (`placementSync` fields).
- `LeadControllerResyncTest` — `POST /api/leads/{id}/placement-sync` studentId resolution + audit.
- `ConvertLeadResponseJsonTest` — Jackson serialization of `placementSync` for the dashboard.
- `InternalStudentSkillLevelControllerTest` (academy) — upsert and race retry on unique violation.
- `InternalApiKeyValidatorTest` (academy / connect / identity) — fails fast under `prod` profile with blank/legacy key.
- `InternalApiKeyAuthFilterTest` (academy) — rejects requests bearing the legacy literal `X-Internal-Key`.
