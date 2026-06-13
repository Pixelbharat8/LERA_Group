# Connect → Academy (CRM placement sync)

When staff convert a CRM lead with an optional linked student, **connect_service** POSTs informal placement data from lead notes to **academy_service**:

`POST {base URL}/api/internal/student-skill-levels/placement-record`

Header: `X-Internal-Key: <shared secret>` (must match academy’s `lera.internal.api-key`).

## Environment variables

Set these in **both** services for every deployment where lead conversion should update Academy skill levels.

| Variable | Where | Purpose |
|----------|--------|---------|
| `LERA_ACADEMY_URL` | **connect_service** only | Base URL of academy_service (no trailing slash). Examples: `http://localhost:8082` (local), `http://academy:8082` (Docker Compose service name), `http://academy-service:8082` (Kubernetes DNS). Maps to `lera.academy.base-url`. |
| `LERA_INTERNAL_API_KEY` | **connect_service** and **academy_service** | Shared secret for `/api/internal/**`. Must be identical on both. If unset on academy, internal routes return **503**. If wrong on connect, `PUT /api/leads/{id}/convert` still returns **200** but `placementSync` reports `ACADEMY_HTTP_ERROR` or `ACADEMY_UNREACHABLE`. |

## Operational signals

- **API:** `PUT /api/leads/{id}/convert` returns `placementSync: { attempted, success, reason, detail, leadId, studentId, updatedExisting? }` so dashboards can show failures and correlate logs (`updatedExisting` when Academy merged into an existing lead-import row).
- **Logs:** connect_service lines tagged `placement_sync leadId=… studentId=…`.
- **Dedupe:** Academy upserts by `(student_id, source_lead_id)`; legacy rows keyed only by notes marker `[lead-import:{uuid}]` are upgraded on next import.

## Frontend

The dashboard calls Connect via Next.js rewrites (`CONNECT_SERVICE_URL`). Do not hard-code service hosts in React components; use relative `/api/...` paths.

See also: `docs/english-centre-execution.md` (section 4), inline comments in `backend/connect_service/src/main/resources/application.properties`.
