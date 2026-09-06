# Pawzr — Consolidated Audit Plan (Wave-wise)

> Branch: `fix/audit-remediation` · Source: 7 parallel inspections (auth/nav, API/data, chat/Firebase, security, UI/theming, build/observability, domain completeness). Duplicates merged. No fixes applied yet.
> Severity tags: **P0** ship-blocking · **P1** broken flow · **P2** medium · **P3** hygiene. Waves are dependency-ordered — do them in order.

## Wave 0 — Secrets, scope decisions, safety gates (no code deps, unblocks everything)

Goal: stop shipping secrets, pin scope so later waves don't build on fiction.

- [P0] Secrets committed + insecure client hints — `src/config/env.ts:33-34,10-11`, `src/lib/auth.tsx:100-101`, `src/lib/firebase.ts:23-26`, `app.json:32`, `.env.example:18-19` vs `env.ts:24-25`, `eas.json:46-47`, `Fastfile:6-10`.
  - What: demo creds `demo@pawzr.app / PawzrDemo2024!`, Google client IDs, Firebase project/sender fallbacks baked into bundle; `.env.example` teaches `EXPO_PUBLIC_AADHAAR_*` (ships Digio secret to client); absolute `~/Downloads` secret paths committed.
  - Why: bundle-extractable creds, no rotation, Digio quota abuse, machine-layout leak.
  - Risks: rotate demo password + `git filter-repo`; move reviewer login to ASC private notes + server-issued demo user; delete hardcoded fallbacks; enforce `validateEnv()` fail-closed in CI; env-var-ize paths; extend `.gitignore` (`.env.*` variants, `*-service-account.json`, `AuthKey_*.p8`, `*.ipa`, `report.xml`).
- [P0] Chat architecture decision (decision only, build in Wave 3) — `MessagesScreen.tsx:111,169-171,248-250`, `ChatInterface.tsx:65,71`, `firebase.ts:93-151`.
  - What: REST `conversationId` used verbatim as Firestore `chats/{id}`; `createOrGetChatThread()` never called.
  - Why: decision (single source of truth vs backend-returned `firestoreChatId` + mapping) must land before any chat code.
- [P0] Wallet/Subscription scope decision (decision only, build in Wave 4/5) — `PawzrWalletScreen`, `EarningsScreen`, `SubscriptionScreen:110,135-141`.
  - What: balances hardcoded, all money buttons dead, fake "benefits now active".
  - Why: must decide real-payments vs "coming soon" + feature-flag before wiring; financial misrepresentation risk.
- Exit: secrets rotated/purged, fallbacks deleted, `validateEnv` gates build, chat + wallet scope recorded.

## Wave 0 decisions (recorded 2026-09-05, branch `fix/audit-remediation`)

- Chat: **Firestore-first with deterministic thread IDs.** Thread docs are created only via `createOrGetChatThread()`; REST conversation endpoints stay for match bootstrap only. No backend change required — deterministic IDs let both clients converge on the same thread. (Wave 3 implements.)
- Wallet/Subscription/Earnings: **coming-soon behind flags.** Remove fake balances and fake success Alerts; screens render an honest placeholder until real payment APIs exist. No store-risk claims ship. (Waves 4–5 implement.)
- Secrets rotation is a human step, not a commit: rotate the demo password, purge it from git history (`git filter-repo`), store the new value only in ASC private notes + `PAWZR_DEMO_PASSWORD` env. Code side (this wave): password deleted from bundle, `Fastfile` reads env, demo login fails closed when `EXPO_PUBLIC_DEMO_EMAIL` is unset.

## Wave 1 — Auth + API foundation + observability

Goal: sessions you can trust, errors you can see. Everything downstream depends on this.

- [P0] Apple second-login orphans account; Google clobbers profile — `auth.tsx:319-336,354-360,235-267`.
  - Why: account "lost", onboarding data overwritten on every re-login.
  - Risks: persist Apple `user`-ID→email map, only fill name/image when non-default, lowercase email keys, migrate on email change.
- [P1] No 401 handling → expired-session loop — `api.ts:69-71`, `auth.tsx:206-220,380-403`, `BookingScreen:72-73`, `PetsScreen:63-64`, `CalendarScreen:110-112`.
  - What: 401 thrown but never clears token/refreshes/forces logout; Apple/Demo never store `token`; Google degrades to local-only user.
  - Risks: add 401→clear→`signOut` interceptor; move `token` to `expo-secure-store`; wire `authApi.appleToken`; server-issued demo. Depends on Wave 0 secrets.
- [P1] API layer bugs — `api.ts:42-82,88-93,107,130-158`, `aadhaarApi.ts:38-74`.
  - What: error mapping only on non-JSON branch, object `errorData.error` → `[object Object]`, 204+JSON crash, brittle network-error match, raw path interpolation (no `encodeURIComponent`), `signal` clobbered (no unmount cancel), unsafe `withRetry`, `aadhaarApi` drift.
  - Risks: fix `apiRequest` once (string-check, 204 guard, encoding, `try/finally`, cancellable variant), dedupe `aadhaarApi`. Low backend risk.
- [P1] Auth loading conflation + iOS Google crash — `AppNavigator:542-544`, `auth.tsx:131-154,195`.
  - What: single `isLoading` unmounts nav mid-sign-in; racy `Promise.race` flashes Authed→Auth; `hasPlayServices()` on iOS throws.
  - Risks: split `isRestoring` vs `isBusy`, remove racy timeouts, Android-gate Play Services.
- [P1] Observability blind in prod — `logger.ts:19-27`, `sentry.ts`, `App.tsx:13,39-43`.
  - What: prod logger no-ops everything, zero `captureException`/`setUserContext` call sites, Sentry disabled on preview builds, no `dist`, fetch failures ignored.
  - Risks: wire user context, API→Sentry, nav breadcrumbs, `dist`; needs DSN via EAS secrets (Wave 0).
- [P2] PII hygiene (token/PII part) — `auth.tsx:227-521`, `api.ts:23-31`.
  - What: JWT in AsyncStorage, full profile persists after logout, case-sensitive keys, Sentry without scrubber.
  - Risks: encrypt or wipe on logout, redact logs/Sentry `beforeSend`.
- Exit: `npx tsc --noEmit` clean; 401 forces re-login; error messages are strings; no setState-after-unmount on core lists.

## Wave 2 — Aadhaar + onboarding

Goal: verification that sticks, onboarding that doesn't lose data. Depends on Wave 1 sessions.

- [P0] Aadhaar sidecar unauthenticated + ephemeral — `app/api/aadhaar/request-otp/route.ts:5,17-20`, `verify-otp/route.ts:6-15,79`, `status/route.ts:5-19`, `AadhaarVerificationScreen:29-31,435-441`, `aadhaarApi.ts`.
  - What: anonymous OTP burn, no rate-limit/`userId` binding, in-memory `Map` breaks on serverless scale-out, `last4` collisions, `status` stub, client never persists `aadhaarVerified`.
  - Risks: Redis/DB + TTL, hash-only storage, JWT auth, throttling, real `status` from DB, `updateUserProfile({aadhaarVerified})`.
- [P0] Onboarding data loss + trapped flows — `VetOnboarding:118-126`, `GroomerOnboarding:112-125`, `onboarding/index.tsx:13-14`, `RoleSelectionScreen:91,98-99`, all `handleComplete` reset calls.
  - What: Vet/Groomer forms discarded, cold restart defaults to OWNER, child-stack `reset(Main)` throws, no validation, step-4 no Back, no signOut escape.
  - Risks: `updateUserProfile` for all roles, parent-stack reset, seed role, persist drafts, validate, add Back/logout.
- Exit: end-to-end Aadhaar verify→persist→Profile shows Verified; Vet/Groomer completion round-trips data; kill-and-resume mid-onboarding keeps role.

## Wave 3 — Chat rebuild (depends on Waves 0–1)

Goal: one working chat store with auth, pagination, honest states.

- [P0] REST↔Firestore ID mapping — `MessagesScreen`, `ChatInterface`, backend `/conversations` (Wave 0 decision → implement here).
- [P0] Firestore auth/rules/crash guards — `firebase.ts:179-300`, `ChatInterface:62-84,330-333`.
  - What: backend-minted custom tokens, `firestore.rules` on `participants`/`senderId==auth.uid`, indexes, `!db` guards everywhere, `onSnapshot` error callbacks, "chat unavailable" banner, don't clear input before ack.
- [P1] Read receipts, typing storm, remount races, non-atomic booking — `ChatInterface:76-108,149-288`, `firebase.ts:243-262`, `MessagesScreen:53,128-176,250`.
  - What: mark-read once-on-mount only, per-keystroke `updateDoc` with no debounce, temp→REST ID swap wipes drafts/duplicates `POST /conversations`, two-write booking confirm, `recipientId` fallback corruption.
  - Risks: `writeBatch`/`limit` or `lastReadAt`, 800ms debounce + timer cleanup, idempotency key, pending-state buttons.
- [P2] Chat perf — unbounded `orderBy(createdAt)`, `ScrollView.map`, N+1 `updateDoc`.
  - What: `limit(50)` + `startAfter` pagination, `FlatList` inverted, batch marks.
- Exit: match→chat→send→read-receipt works with Firebase configured *and* shows honest degraded state without it; no crashes on `db=null`.

## Wave 4 — Domain wiring: mocks → real, CRUD, state machines, location/push (depends on Waves 1–3)

Goal: every role's core journey actually persists.

- [P1] Replace mocks with real fetches — `swipeApi/providersApi/productsApi/eventsApi/cafesApi` (0 UI callers today) → `PetMatch/LoverMatch/Browse/Events/EventDetail/CafeDetail/Appointments/Orders/Inventory/VendorCRM/Analytics/Cafe*`; delete silent `catch→mock` (`CalendarScreen:112`, `ProviderListings:91-93`); add loading/empty/error states; add pagination (none exists).
- [P1] Missing CRUD / dead `onPress` — `petsApi.updatePet`, `bookingsApi.update/cancel`, `ordersApi` status, `productsApi` CUD, `profileApi.updateProfile/updateRole` (IDOR: change to `/users/me/role`); `OrdersScreen:418-431`, `InventoryScreen`, `CafeBookingsScreen:136-140`, `CreateEventScreen:119`, `BrowseScreen`, `EventDetail/CafeDetail` booking, `ProviderProfile:104-109`. Unify stores (`AddProduct→POST /products`; `MyPets↔PetsScreen` single truth; `EditProfile→profileApi`).
- [P1] Booking state machine + IST date bug — free-form `status`, dual cancel paths, `no_show` unreachable, cancelled-orders tab missing, event race, `CalendarScreen:263-267` UTC shift.
  - Risks: enum + transition guard client+server, single cancel path, local-time bucketing.
- [P1] Location + push + deep-linking — `useLocation.ts:28-88`, swipe screens, `notifications.ts` stub, `App.tsx:114-121`, `NavigationContainer` (no `linking`), badge `3`.
  - What: permission denied/blocked path + Settings link, `hasServicesEnabledAsync`/`getLastKnownPosition`, throttle `PUT /users/location`, install `expo-notifications` + channel + token upload, `linking` config + tap routing.
  - Risks: needs EAS plugin + backend push endpoint.
- [P2] Media upload — local `file://` pet/product photos never uploaded.
  - Risks: needs upload endpoint + `expo-image` caching.
- Exit: role-matrix smoke (OWNER/LOVER/VET/GROOMER/SUPPLIER/CAFE) completes create→manage→cancel flows against backend; offline/denied-permission paths honest.

## Wave 5 — UI quality + build hygiene (parallelizable, do last)

Goal: consistent, accessible, shippable artifact.

- [P1] Accessibility + nav correctness — 0 a11y props repo-wide; 36px targets, 2.8:1 tabs, 11px labels, modals w/o `onRequestClose`, `ProfileScreen:218 navigate('Pets')` crash, `CafeEvents:212 → EventDetail` missing route, GROOMER label/content mismatch, consumer-teal vs orange tab, `F5970B` typo ×2, `getRoleColor/getRoleLightColor` unification.
- [P2] Theme-token + responsive codemod — zero screens import `typography/spacing/shadows`; static `Dimensions.get` (rotation broken); `isTablet` landscape-phone bug; inverted `tablet > largeTablet`; `height:100` spacers; fixed `width-48` modals. Migrate to tokens + `useWindowDimensions`/`getResponsiveValue`/`getTabBarHeight()+insets`.
- [P2] Feature flags: wire or delete — all `true`, guards registration not callers, `Subscription/Wallet/Events/*` ungated, `HomeScreen.tsx` dead.
- [P2] Build/deploy — `app.json` 1.3.0/46/71 vs `Fastfile` 1.3.0/40 vs `package.json` 1.0.0; `runtimeVersion:appVersion` OTA invalidation + no `checkForUpdateAsync`; `newArchEnabled:false` (forced migration in SDK 55+); `eas.json` internal-track only; `Fastfile` metadata-only + `force+reject` risk; no Android lane; no `typecheck/lint/test`/CI.
- [P2] Stale bloat — tracked `build-*.ipa` (18MB×2), `capacitor.config.ts`, `memory.md`, `report.xml`, duplicate icon scripts, `*-premium` assets, 23B JSON `placeholder-pet.png`, blurry 200px `tabletImage`.
- [P3] Hygiene — duplicate `Dashboard` routes, `Chat:undefined` param lie, `link:{color:primary}` on colored bgs, `x15` opacity strings, hardcoded terms/privacy/favicon, bypassable OTP resend timer, sandbox default, `IS_PRODUCTION=!__DEV__` conflation.
- Exit: tokens/a11y pass, version single-sourced, `typecheck/lint/test` + CI gate added, repo unbloated.

## Verification per wave

`npx tsc --noEmit` after every wave (note: `app/**/*` excluded — add a Next.js check when touching `app/api`) + targeted smoke: Wave 1 auth matrix, Wave 2 onboarding/Aadhaar, Wave 3 chat online/offline, Wave 4 role CRUD + location/push, Wave 5 tablet/a11y + store-submit dry run.

## Wave 5 implementation notes (2026-09-06, branch `fix/audit-remediation`)

Done:
- Nav correctness: `ProfileScreen` `navigate('Pets')` → registered `MyPets` in `ProfileStack`; cafe Events tab is now `CafeEventsNavigator` (CafeEvents/CreateEvent/EventDetail — both prior navigations crashed); `EventDetail/EventsList/CafeDetail` added to `CafeHomeNavigator` (dashboard cards + deep links); GROOMER 2nd-tab label `Bookings` → `Schedule` (content is Calendar); `MainTabParamList.Chat` carries the optional match params instead of `undefined`.
- Role colors single-sourced in `src/theme/colors.ts`: deleted duplicate maps in `AppNavigator`, `RoleSelectionScreen`, `PawzrWalletScreen`; `OnboardingScreen` option colors + `CreateEventScreen`/`CafeOnboardingScreen` aliases now reference the theme; local `getRoleColor` renamed to `getSelectedRoleColor` (was shadowing); `#F5970B15` typo → `#F59E0B15` (matches the amber icons).
- Shared event screens (`EventsList/EventDetail/CafeDetail`) use a viewer-role accent via `createStyles(accent)`: identical teal for CAFE viewers, orange tab-matching chrome for OWNER/LOVER.
- A11y: `onRequestClose` on all 15 modals (9 were missing); hardcoded `tabBarBadge: 3` removed (no unread-count source); `tabBarAccessibilityLabel` on all tabs; inactive tint `gray[400]` → `gray[500]` (≈2.8:1 → ≈4.8:1 on white); phone tab labels 11sp → 12sp; swipe pass/like buttons + modal close buttons got roles/labels; `CafeDashboard` dead pressables now navigate (events → `EventDetail`, bookings → `CafeBookings`).
- Wave 4 spillover finished: `CafeEventsScreen` (was mock) fetches `eventsApi.getMyEvents`; `CafeDashboardScreen` (was mock) fetches `getMyEvents` + `cafesApi.getMyBookings`, derives stats, drops fabricated 4.8-rating/156-visitors; capacity bars guard divide-by-zero; `formatDate` guards invalid dates.
- Money honesty: deleted ~890 lines of dead fake-money code in `PawzrWalletScreen` (mock balances/transactions/rewards/loyalty + 6 unreachable render fns); both wallet surfaces are pure `ComingSoonPanel` + tab chrome.
- Responsive: `isTablet` landscape-phone bug fixed (smallest-side ≥ 600dp only, optional dims param for `useWindowDimensions` reactivity); `getTabBarHeight` largeTablet inversion fixed (70 → 80); `MainNavigator` uses `useWindowDimensions` instead of the launch-frozen snapshot.
- Build: version single-sourced (`package.json` 1.3.0 ← `app.config.js` reads it; `Fastfile` build 40 → 46 to match `ios.buildNumber`); `npm run typecheck` script; `.github/workflows/ci.yml` gating `tsc`; OTA `checkForUpdateAsync` on launch (prod only, silent, never blocks UI).
- Bloat: `git rm capacitor.config.ts`, `assets/placeholder-pet.png` (`{"placeholder": true}`, unreferenced), `src/screens/HomeScreen.tsx` (+ barrel export), `memory.md` (empty template); `npm uninstall @capacitor/assets` (orphaned devDep, 301 packages pruned).

Deferred (human follow-ups, not safe autonomously):
- `newArchEnabled:false` → SDK 55+ forced migration needs a tested native build.
- Full theme-token/typography codemod (semantic hexes still inline across screens; values match the palette — mechanical but 100+ sites, needs visual QA).
- eslint/prettier/test scaffolding (no configs exist; CI currently gates typecheck only), Android Fastlane lane, `Fastfile` `force+reject_if_possible` review, `app/` sidecar terms/privacy hardcoding.
- OTP resend timer is client UX-only by design; abuse enforcement is the Wave 2 server rate limit (5/10min) — no change made.
- `IS_PRODUCTION = !__DEV__` kept: preview builds intentionally report as production until an `APP_VARIANT` scheme lands.
- 18MB `build-*.ipa` files were already untracked (Wave 0); left on disk untouched.
