# LERA Mobile Go-Live Runbook (iOS + Android)

How to take the existing web app to the App Store and Google Play. The codebase is
**already mobile-shippable** — Capacitor is scaffolded, the UI is responsive, push is wired
end-to-end, and auth now persists in the WebView. What remains is operational: deploy,
generate native projects, add credentials, sign, submit.

Architecture: a **thin Capacitor shell** whose WebView loads the live Next.js deployment
(`LERA_MOBILE_URL`). One codebase for web + iOS + Android; most feature releases ship over
the web without a new store submission.

> Prerequisite ordering matters: **the backend must be deployed over HTTPS first** — the
> shell loads a remote URL, so there's nothing to point a build at until go-live is done.
> See `GO_LIVE_CHECKLIST.md` and `SECURITY_SECRET_ROTATION_RUNBOOK.md`.

---

## Step 0 — Backend live over HTTPS (blocker)
Deploy the stack (CloudFormation) and confirm `https://<your-domain>` serves the Next.js app
and `/api/health` is reachable. Until this exists, mobile builds have no URL to load.

## Step 1 — Point the shell at production
```sh
export LERA_MOBILE_URL=https://app.your-domain.com   # the deployed Next.js, NOT an API host
# cleartext auto-disables for https:// (strict by default). Leave LERA_MOBILE_INSECURE unset.
```
`frontend/capacitor.config.ts` reads this. appId is `com.lera.app`, appName `LERA`.

## Step 2 — Generate the native projects (one-time, per machine)
Needs Xcode + CocoaPods (iOS) and/or Android Studio + SDK (Android).
```sh
cd frontend
npm ci
npm run mobile:bootstrap          # probes toolchains, runs `cap add` for what's available
# or individually:
npm run mobile:add:ios
npm run mobile:add:android
npm run mobile:assets             # app icon + splash from the brand colors
npm run mobile:sync               # push web config into the native projects (re-run after web changes)
```

## Step 3 — Push notification credentials
Delivery is gated: with the env vars unset, each platform is silently skipped (safe to roll
out one at a time). Set these on the **connect_service** runtime, then `LERA_PUSH_ENABLED=true`.

```sh
export LERA_PUSH_ENABLED=true
# APNs (iOS) — from the Apple Developer portal (Keys → create an APNs Auth Key .p8)
export APNS_TEAM_ID=ABCDE12345
export APNS_KEY_ID=XYZ1234567
export APNS_BUNDLE_ID=com.lera.app
export APNS_KEY_PATH=/secure/AuthKey_XYZ1234567.p8
export APNS_SANDBOX=true                  # true for TestFlight/dev; false for App Store release
# FCM (Android / Web) — Firebase project → service-account JSON
export FCM_PROJECT_ID=lera-mobile
export FCM_SERVICE_ACCOUNT_PATH=/secure/lera-mobile-fcm.json
```
Wiring (already built, nothing to code): device registers via `lib/native-push.ts` →
`POST /api/device-tokens` → `PushDispatcher` routes iOS→`ApnsClient`, Android/Web→`FcmClient`.

## Step 4 — Verify auth survives a cold start (on device)
The one piece that can only be confirmed on a real device. After the WebView auth-token
work (`lib/native/token-store.ts`):
1. Log in on the device.
2. Force-quit the app, reopen it.
3. **Expected:** still logged in, no redirect to `/auth/login`; authenticated API calls 200.
   (On native the JWT is stored in `@capacitor/preferences` and sent as `Authorization:
   Bearer`, because the HttpOnly cookie isn't reliable in WKWebView.)
If it logs you out: confirm the login response includes `token`, and that
`@capacitor/preferences` is in the synced native project (`npm run mobile:sync`).

## Step 5 — Signing & store submission
- **iOS:** open in Xcode (`npm run mobile:open:ios`), set the team/bundle id (`com.lera.app`),
  archive, upload to App Store Connect → TestFlight → review.
- **Android:** open in Android Studio (`npm run mobile:open:android`), generate a signed
  AAB (upload key), publish to the Play Console internal track → production.
- Store listing assets (screenshots, privacy policy URL, data-safety form) — privacy/terms
  pages already exist at `/privacy` and `/terms`.

---

## Already done (no action needed)
- Capacitor config, deps, and `mobile:*` scripts.
- Responsive UI (mobile-first, 1,000+ breakpoints) + viewport meta.
- WebView-safe code: no top-level `window`/`document`/`navigator`; no hard-coded backend
  hosts (all env-configurable, prod-guarded); CORS allows `capacitor://localhost` + `ionic://localhost`.
- Bearer-token auth path for native (cookies stay for web) — survives cold start.
- Push pipeline (APNs + FCM) end-to-end in code.

## Still blocked on you (credentials / accounts / tooling)
- Backend deployed over HTTPS (Step 0).
- Apple Developer + Google Play accounts; APNs `.p8`, FCM service-account JSON; signing keys.
- A build machine with Xcode / Android SDK.
- On-device verification of Step 4.
