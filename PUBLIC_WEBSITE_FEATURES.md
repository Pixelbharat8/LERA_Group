# Public Website & Conversion Features

Reference for the public marketing site, conversion funnels, and the two items that need
your input to go fully live (VNPay credentials, teacher names). All data is real/backend-driven
— no dummy content.

## Public routes
| Route | What it does | Data source |
|---|---|---|
| `/` | Home — hero, stats (quality tiles), courses, testimonials, gallery, Facebook | CMS (`/api/cms-settings/map/homepage`) + live courses/testimonials |
| `/courses` | Course catalogue with real prices, age/level badges, filters | `/api/courses/active` |
| `/courses/[slug]` | Course detail — real price, curriculum, class structure; Enrol/Trial CTAs; Course JSON-LD | `/api/courses/code/{code}` |
| `/pricing` | Tuition comparison table (all programmes) + "what's included" | `/api/courses/active` |
| `/teachers` | "Meet our Teachers" directory (only teachers with a public Display name) | `/api/teachers/public` |
| `/enroll` | Online enrolment — pick programme, reserve a place (+ Pay online when enabled) | `/api/public/leads`, `/api/public/payment/*` |
| `/enroll/result` | VNPay return result (success / failed / invalid) | redirect target |
| `/corporate` | B2B / corporate training enquiry | `/api/public/leads` |
| `/portal` | Parent & student portal preview (marketing) | static (describes real portal features) |
| `/book-trial`, `/placement` | Free-trial booking, placement self-check | `/api/public/leads` |
| `/about`, `/contact`, `/blog`, `/blog/[slug]`, `/faq`, `/centers` | Standard pages | CMS + live FAQs/blog/centers |

**SEO:** per-page `<title>`/description/OG via segment `layout.tsx`; EducationalOrganization + Course + FAQPage JSON-LD; dynamic `sitemap.ts` (live courses + blog); `robots.ts`. Floating Zalo/phone/Messenger widget on every public page.

## CRM lead tags (utm_medium)
Every public funnel POSTs to `/api/public/leads` and is filterable in the CRM by `utm_medium`:
`trial_booking` · `placement_quiz` · `corporate_training` · `online_enrolment`.

## ▶ Activate: publish teachers (no code)
The `/teachers` page shows a teacher only once they have a **public Display name**.
1. Dashboard → **Academy → Teachers** (also on Superadmin / Academic Manager).
2. **Edit** a teacher → **"Public profile (website)"** section.
3. Set **Display name** (EN/VI), optional **Photo URL** + VI bio, tick **Native / Featured**.
4. **Save** → appears on `/teachers` immediately. "Featured" sorts first.

## ▶ Activate: online card payment (VNPay)
Payment is **off until configured** (the "Pay online" button is hidden; `/enroll` keeps the
"reserve, pay later" flow). The integration is built + verified (HMAC-SHA512 signature, success →
PAID, tampered signature rejected). To enable:

1. Get a **VNPay merchant account** (sandbox first): `vnp_TmnCode` + `vnp_HashSecret`.
2. Set env for **payment_service** (`.env.development` locally, or prod env):
   ```
   VNPAY_TMN_CODE=<terminal code>
   VNPAY_HASH_SECRET=<hash secret>
   # production only:
   VNPAY_PAY_URL=https://pay.vnpayment.vn/vpcpay.html
   VNPAY_RETURN_URL=https://<your-domain>/api/public/payment/vnpay-return
   ```
3. Register the return URL in the VNPay merchant portal; restart `payment_service`.
4. Verify: `GET /api/public/payment/status` returns `{"enabled":true}`; the green
   **"Pay … now"** button appears on `/enroll`. Test a full sandbox payment before going live.

A `PAID` `enrolment_orders` row is the back-office signal to create the real enrolment + invoice
(internal billing already exists).

## Deploy note
Dev builds schema via Hibernate `ddl-auto=update`; **production uses `validate` + Flyway**.
Flyway migrations for this session's schema live at `V20260626__*` in academy_service and
payment_service. The dev DB's Flyway history is partial (dev relies on ddl-auto), so verify a
clean Flyway run against a fresh DB before a production deploy.
