# LERA — Marketing Module, Backend Wiring & Growth Strategy

_A phased plan covering (A) finishing the marketing module on real data + live publishing + real ROI,
(B) wiring the remaining mock pages to the backend, and (C) a CEO-level growth strategy._

## Where we are today
- **Main marketing dashboard** — fully on real backend data (reach, engagement, spend, platforms). ✅
- **Facebook/Instagram Connect + Sync** — live Meta Graph API integration; paste a Page token → pull real followers. ✅
- **Sub-pages** (`ads-campaigns`, `content-calendar`, `analytics`, `roi`) — already call real APIs; need an audit pass for completeness, working buttons, and real ROI.
- **~83 dashboard pages** make no API call yet — a mix of (a) profile pages that read context (mostly fine), (b) admin CRUD pages that need wiring, (c) AI pages needing `ai_gateway`.

---

## Part A — Finish the Marketing Module

### A1. Audit & harden the 4 sub-pages (real data, every button works)
- **Ads & Campaigns** — confirm create / edit / pause / delete all hit `/api/marketing-campaigns` (+ `/api/ad-campaigns`, `/api/ad-accounts`); show real budget vs spent; no static rows.
- **Content Calendar** — scheduling a post must persist to `/api/social-media-posts` with `status=SCHEDULED` + `scheduledAt`; draft → scheduled → published flow; calendar reads real posts.
- **Analytics** — per-platform & per-post metrics from `/api/social-analytics` + `/api/social-media-posts/stats`; remove any leftover literals.
- **ROI** — see A3.

### A2. Live social publishing (Meta Graph API)
- Extend `social_media_service`: when a post is **published** (or its `scheduledAt` arrives) and the platform is **connected**, call the Graph API:
  - Facebook: `POST /{page-id}/feed` (text/link) or `/{page-id}/photos` (image), with the stored page token.
  - Instagram: 2-step container publish (`/{ig-user-id}/media` → `/media_publish`).
- Store the returned **provider post id** + status on `social_media_posts`; surface real publish errors verbatim (same honest pattern as Sync).
- A **scheduler** (`@Scheduled`) publishes due posts. _Reuses the connect/token plumbing already built._

### A3. Real campaign ROI (from real spend + leads + revenue)
- Tag inbound **leads** with their source campaign (UTM / `campaignId` on the public lead form → `connect_service` leads).
- ROI per campaign = `(revenue from enrolled attributed leads − spentAmount) / spentAmount`, where revenue comes from `payment_service` for those students.
- Replace any static ROI numbers with this computed value; show cost-per-lead and cost-per-enrollment.

---

## Part B — Wire remaining features to the backend

Triage the ~83 no-API pages and wire them in priority order. Most backends already exist; the work is frontend `apiFetch` + CRUD + empty states.

| Priority | Domain | Pages (examples) | Backend |
|---|---|---|---|
| P1 | Finance | `finance/ledger`, `fee-receipts`, `payment-methods`, `scholarships`, `student-scholarships`, `late-fee-rules` | payment_service |
| P1 | Payroll | `superadmin/payroll/*` (cycles, bonuses, deductions, tax, payouts, salary-components, overtime) | payroll_service |
| P2 | CRM | `superadmin/crm/*` (leads, referrals, triggers, campaign-leads, statuses) | connect_service |
| P2 | Academy | `academy/classes`, `superadmin/classes`, `course-modules/lessons/materials` | academy_service |
| P3 | Library | `superadmin/library/*` (inventory, borrowings, reservations, fines, authors…) | academy_service |
| P3 | Chat / AI | `superadmin/chat/*`, `superadmin/ai/*` | connect_service / ai_gateway |
| P3 | Website content | `chairman/website-content/*`, `superadmin/cms-pages`, `banners`, `footer-settings` | academy/identity CMS |
| — | Profiles | `*/profile` | mostly read context already — verify, low effort |

**Per-page recipe:** find the endpoint → `apiFetch` on load → wire create/edit/delete buttons → add empty/error states → remove hardcoded arrays. Batch by domain so one service is verified at a time.

---

## Part C — CEO growth strategy ("open new markets")

### Funnel (instrument end-to-end, then optimize)
Lead capture → nurture → **free trial class** → enrollment → retention/renewal. CRM already has leads, referrals, and renewals — connect them so every stage is measured.

### Growth levers
1. **Paid social, now measurable** — with real ROI (A3), shift budget to the best-performing channel/campaign instead of guessing.
2. **Referral engine** — formalize the existing CRM referrals (reward on enrolment); referrals are the cheapest, highest-LTV channel for education.
3. **SEO + content** — the blog/website CMS exists; publish ranking content (IELTS tips, parent guides) to cut paid CAC over time.
4. **New market segments** — (a) **corporate/B2B English**, (b) **online/hybrid** classes to reach beyond current cities, (c) **new center locations** once unit economics are proven.
5. **Retention** — renewals + attendance signals to flag at-risk students early; retention is cheaper than acquisition.

### KPIs to put on the Chairman dashboard
- **CAC** (per channel) · **LTV** · **LTV:CAC** · trial→enrol **conversion %** · channel **ROI** · **renewal rate** · **NPS**.
- Decision rule: scale channels with ROI > target, cut the rest — driven by the real marketing dashboard.

---

## Suggested sequencing
1. **A1** sub-page audit (fast, high visibility) →
2. **B/P1** finance + payroll wiring (most-used admin areas) →
3. **A3** real ROI →
4. **A2** live publishing (needs connected tokens) →
5. **B/P2–P3** remaining domains →
6. **C** strategy dashboards (KPIs) layered on the now-real data.
