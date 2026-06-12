# 🔍 NEW Loopholes, Gaps & Missing Features Analysis
## Beyond FULL_GAP_ANALYSIS_10M_SCALE.md

**Date:** June 2025 (Updated: April 2026)  
**Scope:** Issues NOT covered in the original gap analysis  
**Total New Issues Found:** 18 + 4 additional  
**Status:** 18/22 FIXED ✅

---

## ✅ FIX STATUS SUMMARY

| # | Issue | Status |
|---|-------|--------|
| 1 | Wildcard CORS (all 9 SecurityConfig + 150+ controllers) | ✅ FIXED |
| 2 | Password Reset HashMap → ConcurrentHashMap | ✅ FIXED |
| 3 | System.out.println leaking reset tokens | ✅ FIXED |
| 4 | Hardcoded Internal API Key → env var | ✅ FIXED |
| 5 | XSS via dangerouslySetInnerHTML (blog) | ✅ FIXED |
| 6 | Impersonation audit logging | ✅ FIXED |
| 7 | Frontend hooks bypass apiFetch | ✅ FIXED (May 2026) — `useFormConfig` / `useCustomFields` / `useWebsiteSettings`; centralized `uploadFile()` for all `/api/upload` callers |
| 8 | Zero Email Service | ⏳ PENDING (new feature) |
| 9 | @Valid on all @RequestBody (465 added) | ✅ FIXED |
| 10 | No Flyway/Liquibase | ✅ FIXED (May 2026) — all nine services: Flyway on, `baseline-on-migrate`, `flyway-database-postgresql`, **separate `spring.flyway.table` per service** on shared PostgreSQL |
| 11 | File Upload path traversal + UUID filenames | ✅ FIXED |
| 12 | GlobalExceptionHandler in all 9 services | ✅ FIXED |
| 13 | System.out.println in production code | ✅ FIXED |
| 14 | @Async thread pool config (academy_service) | ✅ FIXED |
| 15 | No @Scheduled tasks in 6 services | ⏳ PENDING |
| 16 | academy_service service layer refactoring | ⏳ PENDING (large effort) |
| 17 | connect_service service layer refactoring | ⏳ PENDING (large effort) |
| 18 | ddl-auto=update safety | ✅ VERIFIED OK (prod uses validate) |
| 19 | Security Response Headers (all 9 services + frontend) | ✅ FIXED |
| 20 | Auth brute-force rate limiting (10 req/min) | ✅ FIXED |
| 21 | 75 controllers leak e.getMessage() to clients | ✅ MITIGATED (2026-05) — `@RestControllerAdvice` in all nine services returns generic HTTP 500 bodies; auth failures use fixed client copy; targeted controller fixes for upload / salary / identity custom fields |
| 22 | DiscountService missing method aliases | ✅ FIXED |

---

## 🔴 CRITICAL SECURITY LOOPHOLES (7 items — fixing now)

### 1. Wildcard CORS on ALL Controllers + SecurityConfig
**Risk:** Any website can make authenticated API calls to your backend  
**Location:** 20+ controllers have `@CrossOrigin(origins = "*")`, SecurityConfig has `setAllowedOrigins(List.of("*"))`  
**Fix:** Restrict to actual domains (localhost:3000 for dev, production domain)

### 2. Password Reset Tokens in Non-Thread-Safe HashMap
**Risk:** Race conditions, data loss on restart, memory leak  
**Location:** `AuthController.java` line 35: `private static final Map<String, Map<String, Object>> resetTokens = new HashMap<>()`  
**Fix:** Use ConcurrentHashMap + TTL cleanup

### 3. System.out.println Leaks Reset Tokens
**Risk:** Anyone with server log access can reset any user's password  
**Location:** `AuthController.java` lines 81-82 print tokens + reset links to stdout  
**Fix:** Use SLF4J logger at DEBUG level only

### 4. Hardcoded Internal API Key — MITIGATED (2026-05)
**Risk:** If source code leaks, attacker has valid API key  
**Original issue:** `LERA_INTERNAL_SVC_KEY_2024` shipped as a property-file default for `lera.internal.api-key`.  
**Fix applied:** Default removed (`LERA_INTERNAL_API_KEY` defaults empty); `InternalApiKeyValidator` fails fast under `spring.profiles.active=prod` when blank or legacy literal; academy/connect filters treat the legacy literal as unset (503). Identity `AuthController` ignores internal-register elevation unless a non-weak key is configured. **ExcelImportController** still uses `#{null}` when unset — callers must set env in prod. Deploy checklist: [backend/connect_service/PLACEMENT_SYNC_ENV.md](backend/connect_service/PLACEMENT_SYNC_ENV.md).

### 5. dangerouslySetInnerHTML XSS Vulnerability
**Risk:** Stored XSS if blog content contains `<script>` tags  
**Location:** `frontend/app/blog/[slug]/page.tsx` line 156  
**Fix:** Use DOMPurify to sanitize HTML

### 6. Impersonation Endpoint Uses EntityManager Directly
**Risk:** No audit trail, no service layer validation  
**Location:** `ImpersonationController.java` — issues JWT as another user  
**Fix:** Add audit logging + move to service layer

### 7. Frontend Hooks Bypass apiFetch (No 401 Auto-Redirect)
**Risk:** Expired tokens silently fail, no automatic re-auth  
**Location:** `useCustomFields.tsx`, `useFormConfig.ts`, `useWebsiteSettings.tsx`  
**Fix:** Convert to use centralized `apiFetch()`

---

## 🟠 HIGH PRIORITY GAPS (6 items — fixing now)

### 8. Zero Email Service
**Problem:** Password reset, notifications, enrollment confirmations cannot send email  
**Evidence:** grep for `sendEmail|MailSender|JavaMailSender|smtp` = 0 matches  
**Fix:** Add Spring Mail + EmailService to identity_service

### 9. Only 2 Endpoints Use @Valid (200+ Don't)
**Problem:** Any garbage JSON is accepted by the API  
**Evidence:** Only AuthController register + login have `@Valid @RequestBody`  
**Fix:** Add `@Valid` to ALL @RequestBody parameters

### 10. No Database Migration Tool
**Problem:** Schema changes via `ddl-auto=update` — no versioning, no rollback  
**Evidence:** grep for Flyway/Liquibase = 0 matches  
**Fix:** Add Flyway baseline migration to identity_service (primary DB)

### 11. File Uploads Stored on Local Filesystem
**Problem:** Files lost on redeploy, no CDN, no virus scanning, path traversal risk  
**Location:** `UploadController.java` uses `System.getProperty("user.dir") + "/uploads/"`  
**Fix:** Add configurable upload path + UUID filenames

### 12. No GlobalExceptionHandler in 5 Services
**Problem:** Unhandled exceptions return raw stack traces  
**Missing in:** payment_service, payroll_service, social_media_service, ai_gateway, rule_engine  
**Fix:** Create GlobalExceptionHandler in all 5

### 13. System.out.println in Production Code
**Problem:** Bypasses log level controls, clutters stdout  
**Location:** AuthController (2), CallController (1)  
**Fix:** Replace with SLF4J logger

---

## 🟡 MEDIUM PRIORITY GAPS (5 items)

### 14. No @Async Thread Pool Configuration
**Problem:** Default single-thread executor for async tasks  
**Location:** academy_service has 2 @Async methods but no TaskExecutor bean

### 15. No @Scheduled Tasks in 6 Services
**Problem:** No automated jobs for invoicing, payment reminders, payroll cycles  
**Only present in:** attendance (6 tasks), social_media (3), rule_engine (setup only)

### 16. academy_service (~90 Controllers) Not Refactored
**Problem:** Controllers inject Repository directly, no service layer

### 17. connect_service (42 Controllers) Not Refactored
**Problem:** Same as above

### 18. ddl-auto=update in Dev Properties
**Problem:** If dev profile runs against prod DB, schema auto-modifies
**Note:** prod properties correctly use `validate`

---

## ✅ FIXING ALL CRITICAL + HIGH ITEMS NOW...
