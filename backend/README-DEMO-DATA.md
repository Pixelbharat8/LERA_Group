# Demo data

Each service ships a `src/main/resources/data-demo.sql`. **Spring does not load these
automatically** — its default `spring.sql.init.data-locations` is `classpath*:data.sql`, and
that file no longer exists in any service.

That is deliberate. These files contain fabricated business records — invented students,
teachers, classes, payments, refunds, ledger entries, payroll runs, attendance, CRM leads and
AI conversations — plus, in identity, **working login accounts whose passwords are written in
the comments** (`Chairman@Leraacademy.edu.vn` / `admin123`, and others). None of it should
ever reach an environment holding real records.

Previously they were named `data.sql` with `spring.sql.init.mode=always` in every service's
base `application.properties`. Only the `prod` and (for identity alone) `docker` profiles set
`never`, so any environment that did not explicitly override the mode seeded the whole lot —
including a CHAIRMAN god-mode account with a published password. The rows also use
`gen_random_uuid()` ids, so `ON CONFLICT` never matched and the data multiplied on every boot;
that is what left 14x duplicate payments and 22x enrollments in the dev database.

## What replaced them

Genuine reference data now seeds from code, in every profile including prod:

- **Roles** (14) — `DataLoader.createDefaultRoles()`
- **Permission catalog** (26) — `DataLoader.seedPermissionCatalog()`, derived from `ALL_CODES`
  so the Java list and the database cannot drift apart. This previously existed *only* in
  identity's `data.sql`, which meant it never loaded in prod at all and the Chairman's
  Roles & Permissions grid came up empty there.
- **Chairman / CEO / admin accounts** — `DataLoader`, with passwords from `LERA_SEED_*`, or a
  strong random one logged once at startup if those are unset.

## Loading demo data in local development

Only ever against a throwaway database:

```bash
docker compose exec -T postgres psql -U lera -d lera \
  < backend/academy_service/src/main/resources/data-demo.sql
```

Or point Spring at it for a single run:

```bash
SPRING_SQL_INIT_MODE=always \
SPRING_SQL_INIT_DATA_LOCATIONS=classpath:data-demo.sql \
  mvn -pl academy_service spring-boot:run
```

The files are order-dependent across services (academy's students are referenced by payment's
invoices and attendance's records), so load identity → academy → the rest if you want them to
join up.
