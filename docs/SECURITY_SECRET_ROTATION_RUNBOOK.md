# Security Secret Rotation & History Scrub — Runbook

**Why:** the JWT signing secret and DB password were committed to git in plaintext and are
still in history. The codebase no longer reads any hardcoded fallback (every service now
requires `${JWT_SECRET}` / `${DB_PASSWORD}` with no default), so the fix is operational:
**rotate the values, then remove the old ones from history.**

Do these in order. Step 1 neutralizes the live risk; step 2 is cleanup.

---

## Compromised values to retire

| Secret | Old (compromised) value | Where it lived |
|--------|-------------------------|----------------|
| JWT secret (base64) | `bGVyYUFjYWRlbXlTZWNyZXRLZXkyMDI0VmVyeUxvbmdTZWN1cmVLZXlGb3JKd3RUb2tlbkdlbmVyYXRpb24=` | all 9 services' `application.properties` + `JwtService` |
| JWT secret (decoded) | `leraAcademySecretKey2024VeryLongSecureKeyForJwtTokenGeneration` | — |
| DB password | `lera123` | `application.properties`, `docker-compose.yml` |
| MinIO password | `lera123456` | `docker-compose.yml`, `.env.example` |
| pgAdmin password | `admin123` | `docker-compose.yml`, `.env.example` |
| Internal API key | `LERA_INTERNAL_SVC_KEY_2024` | identity `application.properties` (older commits) |
| Seed user passwords | `admin123` / `chairman123` / `ceo123` / `password123` | `DataLoader.java` (fixed), `data.sql` (dev only) |

---

## Step 1 — Rotate (do first; stops token forgery)

### 1a. Generate new values
```bash
# JWT secret — Base64, >= 32 bytes (services Base64-decode it for HS256)
openssl rand -base64 48
# DB / MinIO / pgAdmin / internal-key — strong random strings
openssl rand -base64 24
```

### 1b. Set them in the deploy environment / secrets manager (NOT in git)
All 9 backend services share one JWT secret — they must all receive the **same** new
`JWT_SECRET`, or cross-service token validation breaks. Required vars:

```
JWT_SECRET=<new base64>
DB_PASSWORD=<new>
LERA_INTERNAL_API_KEY=<new>
MINIO_ROOT_USER=<new>   MINIO_ROOT_PASSWORD=<new>
PGADMIN_PASSWORD=<new>
# identity bootstrap (or they generate random + log once):
LERA_SEED_ADMIN_PASSWORD=<new>  LERA_SEED_CHAIRMAN_PASSWORD=<new>  LERA_SEED_CEO_PASSWORD=<new>
```

### 1c. Rotate the database password itself, then redeploy
```sql
ALTER USER lera WITH PASSWORD '<new DB_PASSWORD>';
```
Then redeploy all services with the new env. **Rotating `JWT_SECRET` invalidates all
existing tokens — every user must re-login.** Schedule a brief window or communicate it.

### 1d. Verify
- Boot a service with `JWT_SECRET` unset → it must fail fast (confirms no fallback remains).
- Log in fresh → new token works; an old (pre-rotation) token is now rejected.

---

## Step 2 — Scrub history (cleanup; turns the gitleaks CI gate green)

> History rewrite is destructive and force-pushes. Coordinate with everyone — all
> collaborators must re-clone afterward. Run on a **fresh clone with no uncommitted work**
> (the current working tree has ~1,900 staged files; commit or stash them first, or this
> will refuse to run / lose changes).

```bash
# Install the tool (preferred over filter-branch/BFG)
pip install git-filter-repo            # or: brew install git-filter-repo

# Fresh mirror clone
git clone --mirror <repo-url> lera-scrub && cd lera-scrub

# Replacement rules — each old secret -> a redaction token
cat > /tmp/secrets.txt <<'EOF'
bGVyYUFjYWRlbXlTZWNyZXRLZXkyMDI0VmVyeUxvbmdTZWN1cmVLZXlGb3JKd3RUb2tlbkdlbmVyYXRpb24=
leraAcademySecretKey2024VeryLongSecureKeyForJwtTokenGeneration
LERA_INTERNAL_SVC_KEY_2024
lera123456
lera123
admin123
chairman123
ceo123
EOF

git filter-repo --replace-text /tmp/secrets.txt

# Review, then publish the rewritten history
git push --force --all
git push --force --tags
```

After the force-push:
- Everyone deletes their local clone and re-clones.
- The gitleaks CI job (added in `.github/workflows/lera-ci.yml`) should pass on `main`.
- Rotate again **only if** any value above was reused anywhere outside this repo.

---

## Step 3 (follow-ups, lower priority)

- **Impersonation / `api.ts`**: make `/api/impersonation` set an HttpOnly cookie so the
  frontend can stop writing the JS-readable `token` cookie (XSS surface). Verify login +
  impersonation with the app running before removing the JS writes.
- **CloudFront OAC**: lock the frontend S3 bucket to CloudFront-only; re-test SPA 404
  routing (it currently relies on S3 `WebsiteConfiguration`).
- **Dev `data.sql`** demo users keep known passwords but are disabled in prod
  (`spring.sql.init.mode=never`); leave for local dev or gate behind a `dev` profile.
