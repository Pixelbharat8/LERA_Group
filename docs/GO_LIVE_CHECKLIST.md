# LERA — Go-Live Checklist

Status at writing: code is feature-complete and **builds clean** (full `next build` 311 pages,
all 9 backend services compile), all data-loss stubs are real, security hardening is in code.
The remaining blockers are **deploy / ops / security execution** — they need YOUR git + AWS
credentials, so they can't be run from the dev assistant. Each step below is copy-paste ready.

Branch to ship: `feature/homepage-facebook-cms` (23 commits ahead of `main`).

---

## 🔴 1. Get the code into main (push + PR + merge)
No remote is configured and nothing is pushed. From a clean checkout:

```bash
git checkout feature/homepage-facebook-cms
git push -u origin feature/homepage-facebook-cms      # also push security/go-live-hardening if separate
gh pr create --base main --head feature/homepage-facebook-cms \
  --title "LERA platform: hardening + CRM/employee modules + Bucket-B fixes" \
  --body "See commits d0e97fd..HEAD"
# review, then squash/merge to main
```
**Note:** the working tree has ~1,827 pre-existing uncommitted files — decide what of that
belongs in the release and commit/stash it separately so the PR is clean.

**Verify:** `git log origin/main` shows the merge; CI is green on `main`.

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
- [ ] On `main`, CI green
- [ ] Secrets rotated + history scrubbed
- [ ] Infra deployed (us-east-1 WAF), migrations applied on prod
- [ ] Logs + metrics + alerts live
- [ ] Test creds/data rotated; `LERA_SEED_*` set in prod
- [ ] SMTP configured; smoke-test a real login on the deployed URL
