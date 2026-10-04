# Going live — soft launch (public site + logins + email, no payments)

> **This is the operator runbook: the ordered commands to follow on the server.** The
> authoritative status-and-decisions record is `docs/GO_LIVE_CHECKLIST.md`, which predates this
> file and carries the evidence behind each claim (secret rotation, the hosting-country decision,
> the §3a schema-bootstrap proof, Vietnam compliance). Read that for *why*; follow this for *how*.
> Where they disagree, trust the checklist.

Written for whoever runs the deployment. Follow the steps in order; step 4 and step 7 are the
two places where getting it wrong is costly.

Scope of this runbook: the public website, all dashboard logins, and outbound email.
**Online payments are deliberately off** — VNPay credentials are not set, so anything that
charges a customer will not work. See "Known gaps at launch" at the end.

---

## 1. Prerequisites on the server

- Docker and the Compose plugin installed.
- Ports **80 and 443** open to the public internet. Caddy needs :80 reachable to solve the
  Let's Encrypt challenge — if :80 is firewalled, certificate issuance fails.
- Your domain's **DNS A-record pointing at the server's public IP**, and propagated. Check from
  somewhere other than the server: `dig +short app.your-domain.com`.
- The repository checked out at the commit you intend to ship.

### A constraint on the hostname

The WebSocket handshake checks the browser's `Origin` against `lera.cors.allowed-origins`,
which defaults to `https://*.leraacademy.edu.vn` (plus localhost and the Capacitor schemes).
**If `DOMAIN` is a subdomain of `leraacademy.edu.vn`, there is nothing to do.** If you deploy on
any other hostname, set `CORS_ALLOWED_ORIGINS` in step 3 to include it:

```
CORS_ALLOWED_ORIGINS=https://your-host.example,capacitor://localhost,ionic://localhost
```

Get this wrong and the symptom is misleading: messages still arrive, because both chat screens
poll every 4 seconds when the socket is down. What silently stops working is voice and video
calling, whose signalling has no fallback.

## 2. Generate the secrets

Run these once and keep the output somewhere safe. They are not recoverable from the server
later in any convenient form, and changing `JWT_SECRET` later logs everyone out.

```bash
openssl rand -base64 32   # JWT_SECRET
openssl rand -base64 24   # LERA_INTERNAL_API_KEY
openssl rand -base64 24   # DB_PASSWORD
openssl rand -base64 24   # MINIO_ROOT_PASSWORD
openssl rand -base64 24   # PGADMIN_PASSWORD
openssl rand -base64 18   # LERA_SEED_CHAIRMAN_PASSWORD
openssl rand -base64 18   # LERA_SEED_CEO_PASSWORD
openssl rand -base64 18   # LERA_SEED_ADMIN_PASSWORD
```

**Set the three seed passwords explicitly.** Leave one blank and the service generates a random
one and writes it to the log exactly once — if you miss that line, that account is unreachable
and the only fix is a fresh database.

## 3. Write the environment file

```bash
cat > .env.production <<'EOF'
DOMAIN=app.your-domain.com

DB_NAME=lera
DB_USER=lera
DB_PASSWORD=<from step 2>
JWT_SECRET=<from step 2>
LERA_INTERNAL_API_KEY=<from step 2>
MINIO_ROOT_USER=lera
MINIO_ROOT_PASSWORD=<from step 2>
PGADMIN_PASSWORD=<from step 2>

LERA_SEED_CHAIRMAN_PASSWORD=<from step 2>
LERA_SEED_CEO_PASSWORD=<from step 2>
LERA_SEED_ADMIN_PASSWORD=<from step 2>
LERA_SEED_ADMIN_EMAIL=admin@leraacademy.edu.vn

# Email stays OFF for the first boot. Step 7 turns it on, and only after the check there.
MAIL_ENABLED=false
EOF
chmod 600 .env.production
```

`LERA_SEED_ADMIN_EMAIL` must stay on a domain you own. The address the reset flow mails to is
whatever sits on the account, and `POST /api/auth/forgot-password` is public.

## 4. Deploy — both compose files, every time

**Use the script — it already does this correctly:**

```bash
set -a && . ./.env.production && set +a
./scripts/vps-first-deploy.sh
```

It detects whether the database is empty and, if so, runs a two-phase bootstrap: backends with
Flyway **off** so Hibernate's `ddl-auto=update` builds the shared schema, then again with Flyway
**on** to apply the migration overlays, waiting for health between the two. On an existing
database it skips phase 1 and just deploys. Afterwards, ordinary deploys are the plain command:

```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --build
```

**Why two phases.** Flyway runs *before* Hibernate, and these migrations are overlays that
`ALTER` tables `ddl-auto` has not created yet. A first boot with Flyway on dies on
`relation "..." does not exist`, which fails `flywayInitializer` and stops the service dead.
Measured on an empty database: academy_service was taken down by exactly that. `rule_engine` is
the one exception and the script knows it — it owns a migration that CREATEs its own tables, so
it starts in phase 2 rather than phase 1.

**Both `-f` flags are mandatory, on this and on every later command.** The single most
important thing the overlay does is **close the ports**. The base compose publishes, to the
host: PostgreSQL on **5432**, pgAdmin on **5050**, MinIO on **9000/9001**, the frontend on
3000, and all nine services on 8081–8089. On a laptop those are conveniences. On a public
server they are your database, your object store and an admin console, open to the internet.
The overlay resets every one of them (`ports: !reset []`) and publishes only Caddy on 80/443.

It also puts Caddy in front of the gateway for TLS, and switches all nine services from the
`docker` profile to `prod` — which is what sets `lera.cookies.secure` and
`lera.security.trusted-proxy` everywhere, both of which matter precisely because Caddy
terminates TLS and forwards `X-Forwarded-For`. Without them session cookies are not marked
Secure and every request appears to come from the proxy. `prod` also drops logging to WARN and
keeps the API docs off.

So if you ever run plain `docker compose up -d` against this stack, you have not merely lost
TLS — you have republished Postgres on 5432 to the public internet. Bring it back up with both
files, and confirm with `docker compose -f docker-compose.yml -f docker-compose.https.yml ps`
that nothing but Caddy lists a published port.

To reach pgAdmin or MinIO, tunnel over SSH rather than publishing the port:

```bash
ssh -L 5050:localhost:5050 user@server   # then open http://localhost:5050
```

> On fake data: there is none to worry about, and this was checked rather than assumed. No
> service contains a `data.sql` or `import.sql`, so Spring's SQL initialisation has nothing to
> load whatever `sql.init.mode` says; the demo files are named `data-demo.sql` and are
> referenced nowhere. Of the five Java seeders, academy's and attendance's return early for
> `prod`, `docker` and `staging`, payroll's is a no-op, and identity's is meant to run — it
> creates the role list, the permission catalogue and the three founding accounts. A fresh
> database therefore comes up with real structure and three real logins, and nothing else.

Consider an alias so it cannot be got wrong:

```bash
alias leracompose='docker compose -f docker-compose.yml -f docker-compose.https.yml'
```

## 5. Verify the boot

```bash
# every service healthy
leracompose ps

# the profile actually in effect — must print prod
docker inspect identity_service --format '{{range .Config.Env}}{{println .}}{{end}}' \
  | grep SPRING_PROFILES_ACTIVE

# NOTHING but Caddy may list a published port. If postgres, pgadmin, minio or any
# 808x service appears here, you are running without the overlay — stop and redeploy.
leracompose ps --format '{{.Service}}\t{{.Ports}}' | grep -v '^caddy'

# and from somewhere OTHER than the server, confirm the database is not reachable:
#   nc -z -w3 app.your-domain.com 5432   # must fail

# TLS answering on the real hostname
curl -sS -o /dev/null -w '%{http_code}\n' https://app.your-domain.com/

# The websocket route reaches connect_service, not the frontend. Unauthenticated you get
# connect_service's own JSON:  {"success":false,"message":"Authentication required"}
# That 401 is the success signal. A 307 to /auth/login means /ws fell through to Next.js
# (the gateway is serving an old config — see the note below), and a 404 means no route.
curl -sS https://app.your-domain.com/ws/chat

# And the URL the browser will be told to open — expect wss://<your domain>/ws/chat
curl -sS https://app.your-domain.com/api/chat/ws-url -H 'Cookie: token=<a real session token>'

# no fake testimonials reached the live database (expect 0)
docker exec lera_postgres psql -U lera -d lera -tAc 'select count(*) from testimonials;'
```

Then log in as `Chairman@Leraacademy.edu.vn` with the password from step 2 and confirm the
dashboard loads.

## 6. Fix the placeholder public content

This is the step that actually protects what visitors see. The public site ships with
placeholder contact details pointing at **Ho Chi Minh City** — about 1,700 km from Hải Phòng —
and placeholder leadership names. The script also clears the placeholder testimonial, FAQ and
leadership rows if a database carried over from development still holds them; on a fresh
database those tables are already empty and the deletes are harmless.

```bash
docker exec -i lera_postgres psql -U lera -d lera < scripts/fix-placeholder-production-data.sql
```

It sets the contact block to the values the repository documents as real — corroborated across
~19 address, ~14 phone and ~6 email references in the public pages:

| | |
|---|---|
| Address | 95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng |
| Phone | 0387.633.141 |
| Email | info@leraacademy.edu.vn |

**Confirm those three against what LERA actually uses before committing** — a wrong digit here
is a phone number that does not ring.

Run it inside a transaction so you can inspect first:

```bash
docker exec -i lera_postgres psql -U lera -d lera <<'SQL'
BEGIN;
\i /dev/stdin
SQL
```

or more simply, copy the file in and use `BEGIN; \i ...; COMMIT;` from a `psql` session. The
script ends with three verification queries: the contact block, any live centre outside Hải
Phòng, and any account on a domain LERA does not own. **All three must read clean before you
`COMMIT`** — the last one is the same check step 7 gates email on.

It is idempotent; running it twice changes nothing the second time. On a fresh database most of
it is a no-op (there are no placeholder rows to correct), and the part that matters is the
contact block, which it creates rather than merely updating.

## 7. Turn email on — after this check, not before

Email is the one feature that converts a dormant problem into a live one. Before enabling it,
confirm no account sits on a domain you do not own:

```bash
docker exec lera_postgres psql -U lera -d lera \
  -tAc "select email from users where email !~* '@leraacademy\.edu\.vn$';"
```

**This must return nothing.** If it returns a row, delete or re-address that account first.
A fresh database built from the current code will be clean — the seeder now creates only
addresses on your own domain — but a database restored or migrated from the old dev data still
contains `admin@lera.com` and `admin@lera.edu.vn`, both SUPER_ADMIN. `forgot-password` is public
and mails the reset link to the address on the account, so with SMTP on, anyone can have a
SUPER_ADMIN reset link delivered to a stranger's inbox.

Once that query is empty, add the mail settings and restart:

```bash
cat >> .env.production <<'EOF'
MAIL_ENABLED=true
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=<smtp user>
MAIL_PASSWORD=<smtp app password>
MAIL_FROM=noreply@leraacademy.edu.vn
EOF

set -a && . ./.env.production && set +a
leracompose up -d --no-deps connect_service
```

Send one real password reset to an address you control and confirm it arrives before relying on it.

## 8. Force a password reset on imported accounts

Accounts created by the bulk importer once had passwords derivable from a roster
(`first3(name) + last4(phone) + '!'`). The importer now generates random passwords, but any
account created before that fix is still guessable. If you are carrying over real imported
users:

```bash
docker exec lera_postgres psql -U lera -d lera \
  -tAc 'select email from users where password_change_required is true;'
```

Reset those passwords out of band rather than trusting the flag, since it was only ever
enforced in the browser.

---

## Known gaps at launch

Accepted deliberately for a soft launch — each is a decision, not an oversight:

| Gap | Consequence today |
|---|---|
| **Online payments off** | No VNPay credentials. Invoices and fee plans record and display correctly; nothing can be paid online. Collect offline and record the payment. |
| **Privacy policy and terms are default wording** | Nobody at LERA has reviewed them. They are public and Vietnam's PDPD applies. This is a legal exposure, not a bug. |
| **Payroll report tax is a browser-side estimate** | It ignores the seven configured `tax_settings` rows. Payroll totals themselves are verified correct — but do not file tax from that report. |
| **Never load-tested** | Correctness is well covered by tests; capacity under real traffic is unmeasured. |
| **Mobile apps not submitted** | The iOS/Android shell builds, but nothing is in either store. |
| **Voice/video calling untested on a server** | The signalling path was dead until `efc7055` and has only been verified by unit tests, never over a real TLS socket. Messaging is unaffected. |
| **No metrics or alerting** | You will find out about an outage from a person, not a dashboard. Prometheus, Grafana and alert rules exist on the unmerged `feat/vps-monitoring` branch — see below. |

### The five unmerged branches

None is required for this launch, and merging on launch day is optional. Each is a single
commit on a base roughly 114 commits old, so the large diff you see against `main` is the
two-way tip difference, not what a merge would remove. Dry-run merges (`git merge-tree`):

| Branch | Merges | Relevance today |
|---|---|---|
| `feat/vps-monitoring` | clean | The only one that touches this path: Prometheus + Grafana + alert rules, and it edits `docker-compose.https.yml`. It also makes `/actuator/prometheus` `permitAll`, which is safe **only** because the overlay publishes no service ports — verified. Merge it if you want monitoring on day one; redeploy after. |
| `chore/next-15-upgrade` | clean | Next 14 → 15. Do not take a framework upgrade on launch day. |
| `fix/mobile-conversion-audit` | clean | Public-site tap targets and form labels. Cosmetic; safe later. |
| `fix/e2e-stale-consent-tests` | clean | Test-only. |
| `fix/deploy-script-two-phase` | **conflicts** in `aws/deploy-aws.sh` | AWS only. Irrelevant to a VPS deploy; leave it. |

## If you need to roll back

```bash
leracompose down                 # keeps the database volume
leracompose down -v              # DESTROYS the database — only for a clean re-run
```

A rebuild of one service after a code change:

```bash
leracompose up -d --no-deps --build <service>
docker restart lera_gateway      # otherwise the gateway serves 502s for that service
```

**Changing `gateway/nginx/nginx.conf` needs a REBUILD, not a restart.** The Dockerfile `COPY`s
the config into the image and nothing mounts it, so `docker restart lera_gateway` keeps serving
the old routes — silently, with no error. This cost a confusing round of "the route is there but
the request still hits the frontend":

```bash
leracompose up -d --no-deps --build --force-recreate gateway
docker exec lera_gateway grep -c 'location \^~ /ws/' /etc/nginx/nginx.conf   # expect 1
```

To check the config before deploying it, run real nginx against it on the compose network (off
the network the upstream service names do not resolve and it fails for that reason alone):

```bash
docker run --rm --network lera_group_lera-net \
  -v "$PWD/gateway/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" nginx:alpine nginx -t
```
