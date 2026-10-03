# Going live — soft launch (public site + logins + email, no payments)

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

```bash
set -a && . ./.env.production && set +a
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --build
```

**Both `-f` flags are mandatory, on this and on every later command.** The overlay does two
things the base file does not: it puts Caddy in front of the gateway and obtains the TLS
certificate, and it switches all nine services from the `docker` profile to `prod`. The `prod`
profile is what sets `lera.cookies.secure` and `lera.security.trusted-proxy` across every
service — both of which matter here specifically because Caddy terminates TLS and forwards
`X-Forwarded-For`. Without them your session cookies are not marked Secure and every request
looks like it came from the proxy. It also drops logging to WARN and keeps the API docs off.

If you run plain `docker compose up -d` against this stack it will recreate the containers
under the `docker` profile, dropping TLS and those two settings. Not fatal, but wrong — bring
it back up with both files.

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

# TLS answering on the real hostname
curl -sS -o /dev/null -w '%{http_code}\n' https://app.your-domain.com/

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

The script wraps its changes in a transaction and prints what it is about to change. **Read that
output and confirm the phone number and email are the ones you actually want** before you let it
commit; they are set from the values in the script, not from anything live.

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
