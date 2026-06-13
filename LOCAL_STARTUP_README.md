# Local startup

Use the canonical scripts at the repo root: **`./start-lera.sh`** to launch and **`./STOP_ALL_SERVICES.sh`** to stop. They load `.env.development` (including `LERA_INTERNAL_API_KEY` for placement sync) and write logs under `.lera-runtime/logs/` and PIDs to `.lera-runtime/pids.txt`.

Optional flags (same command can combine flags):

- **`./start-lera.sh --include-ai`** — starts **ai_gateway** on **8087** and **rule_engine** on **8088** (default URLs in [`frontend/next.config.js`](frontend/next.config.js): `AI_GATEWAY_URL`, `RULE_ENGINE_URL`). Without this, dashboard calls that hit those rewrites return connection errors until you start those services manually.
- **`./start-lera.sh --include-social`** — starts **social_media_service** on **8089** for `/api/social/*` and `/api/social-media/*` rewrites.

**CI note:** GitHub Actions runs `mvn test` on every backend that has JUnit under `src/test`: academy, attendance, connect, identity, payment, payroll, rule_engine, ai_gateway, and social_media_service (see [`.github/workflows/lera-ci.yml`](.github/workflows/lera-ci.yml)).

Placement sync (Connect → Academy internal APIs): **[`docs/ops/connect-academy-placement.md`](docs/ops/connect-academy-placement.md)** and env notes in **`backend/connect_service/PLACEMENT_SYNC_ENV.md`**.

## Automated smoke (CI + local)

- **CI:** the **Build Next.js Frontend** job runs Playwright against production `next start` after `npm run build` (see `frontend/e2e/smoke.spec.ts`).
- **Local:** from **`frontend/`**, after `npm ci`: `npx playwright install chromium` once, then `npm run build && npm run test:smoke` (same two checks as CI; use `npm run test:e2e` for the full Playwright suite if you add more specs).

## Manual smoke checklist (full stack)

After **`./STOP_ALL_SERVICES.sh && ./start-lera.sh`** (add **`--include-ai`** / **`--include-social`** if you use those features). Run **`./start-lera.sh --help`** for ports and flags:

1. **Frontend** — open `http://localhost:3000` and confirm the app shell loads (no infinite compile error in `.lera-runtime/logs/frontend.log`).
2. **Backends** — each process should log `healthy` in the terminal; optionally verify: `curl -sf http://127.0.0.1:8081/actuator/health` through `8086` (and `8087`–`8089` if you started optional services).
3. **Auth** — sign in with a known dev user; confirm API calls return **200** for dashboard data (not mass **502** from missing services).
4. **Placement sync** — with matching `LERA_INTERNAL_API_KEY` in `.env.development`, convert a lead in CRM and confirm academy placement sync does not report `INTERNAL_KEY_MISSING` in connect logs (see placement docs above).

If you see two Next.js dev servers (for example one on **:3000** and another on **:3001** because the port was busy), run `./STOP_ALL_SERVICES.sh` — it clears **3000**, **3001**, **3002**, and stray `next dev` / `next-server` processes — then start again. Thin aliases **`./stop-lera.sh`** and **`./stop-all-services.sh`** run the same stop script; **`./stop-all.sh`** also stops optional Dockerized DB under `database/` and frees the same Next ports.

To thin out hundreds of untracked status `*.md` at the repo root (optional), run **`./scripts/archive-status-markdown-at-root.sh`** — it keeps **README.md**, **QUICKSTART.md**, and **LOCAL_STARTUP_README.md** and moves matching files into **`docs/archive/2026-05/`**.
