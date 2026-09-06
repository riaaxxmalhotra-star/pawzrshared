# AGENTS.md — Pawzr (pawzr-native)

Expo SDK 54 / RN 0.81.5 / React 19.1 / TS strict (`expo/tsconfig.base`). Managed workflow — no `ios/`/`android/` dirs (gitignored, generated). `capacitor.config.ts` is stale, ignore it.

## Entrypoints (don't guess)

- Native app: `index.ts` → `App.tsx` → `src/navigation/AppNavigator.tsx`. `src/` is the app.
- `app/` is **not** the app — it's a Next.js marketing/API sidecar (landing, `/privacy`, `/terms`, `app/api/aadhaar/*`). `tsconfig.json` excludes `app/**/*`, so `tsc` doesn't check it.
- Providers in `App.tsx` must stay nested: `Sentry.wrap → ErrorBoundary → GestureHandlerRootView → SafeAreaProvider → AuthProvider → AppNavigator`. Never return null/blank — render loader. Splash is hidden immediately via `SplashScreen.hideAsync()`; keep that.

## Commands

- `package.json` has only `start`, `android`, `ios`, `web`. No test/lint/format scripts, no CI workflows.
- Typecheck: `npx tsc --noEmit` (covers `src/`, `App.tsx`, `index.ts` only).
- Dev: `npm start` (use Expo dev-client build per `eas.json`, not Expo Go, for Google Sign-In). Native runs: `npm run android` / `npm run ios`.
- EAS profiles (`eas.json`): `development`, `development-simulator` (iOS sim), `preview`/`apk` (internal APK), `production` (remote creds, autoIncrement). App Store submit is Fastlane only: `fastlane ios submit_review` (iOS only, hardcoded to 1.3.0/build 40 — update per release).

## Env & secrets

- Copy `.env.example` → `.env`. All client vars are `EXPO_PUBLIC_*`, read in `src/config/env.ts`.
- Never commit `.env*`, `credentials.json`, `*.keystore/.jks/.p8/.mobileprovision`, `google-services.json`, `GoogleService-Info.plist` (all gitignored).
- `ENV` has hardcoded fallbacks (Google client IDs, Firebase project `pawzr-1b4a7`, API URL `https://pawzrpro.vercel.app/api`). Missing Firebase key/app ID = chat silently degrades to mock/empty, not a crash — check `src/lib/firebase.ts` `isFirebaseConfigured` before debugging chat.
- `IS_PRODUCTION = !__DEV__`; Sentry only sends in production.

## Architecture rules

- Backend is external (`ENV.API_URL`). All REST goes through `apiRequest()` in `src/lib/api.ts`: `Bearer` token from `AsyncStorage 'token'`, 15s timeout, `ApiError(status, code)`. `withRetry` (2 retries) is only wired on list GETs — don't add it to mutations. Don't retry 4xx (except 408/429).
- Chat has two paths — don't mix: Firestore realtime (`src/lib/firebase.ts`, `chats/{id}/messages`) for threads/messages/typing; REST `messagesApi`/`likesApi` for conversations bootstrap. Firestore absence is non-fatal by design.
- Aadhaar/Digio: client must NOT call Digio directly. Backend owns secrets; use `src/lib/aadhaarApi.ts` → `app/api/aadhaar/{request-otp,verify-otp,status}`. `lib/digio.ts` root helper is server-side only.
- Auth (`src/lib/auth.tsx`): storage keys `user`, `token`, `userProfile_<email>`. Profile-by-email survives logout and is source of truth on re-login — update all three on profile/role/onboarding changes. Gate: `!user → Auth`, `!onboardingComplete → RoleSelection → Onboarding → Main`.
- Google native sign-in throws/falls back in dev (`Try Demo` instead). Demo login is env-gated (`EXPO_PUBLIC_DEMO_EMAIL`; fails closed with an Alert when unset) — keep working. Reviewer password lives ONLY in `PAWZR_DEMO_PASSWORD` env / ASC private notes, never in the repo.
- Roles: `OWNER LOVER VET GROOMER SUPPLIER CAFE` (`src/config/featureFlags.ts`, `ENABLED_ROLES`). Role color map in `src/theme/colors.ts` + `AppNavigator.roleColors` (OWNER/LOVER orange `#F97316`, VET `#10B981`, GROOMER `#8B5CF6`, SUPPLIER `#3B82F6`, CAFE `#14B8A6`). CAFE gets a separate tab stack (Home/Events/Bookings/Chat/Profile); VET/GROOMER 2nd tab = Calendar, SUPPLIER = Orders, OWNER/LOVER = swipe (`LoverMatchScreen` vs `PetMatchScreen`). Gate new HomeStack screens behind `FEATURES` flags.
- OTA: `runtimeVersion.policy: appVersion` — bumping the version in `app.config.js` invalidates prior OTA updates. Keep `bundleIdentifier`/`package` `com.pawzr.app` and EAS `projectId` stable. `app.config.js` throws on missing Google client IDs (fail-closed gate) and derives the iOS URL scheme from env — don't re-hardcode IDs.

## UI conventions

- Theme tokens only: `src/theme/` (`colors`/`roleColors`, `spacing`, `typography`), bg `#FFFBF5`. Responsive via `src/utils/responsive.ts` (`getTabBarHeight`, `getTabBarFontSize`, `isTablet`).
- Tab icons: always wrap in the 40×40 `tabIconWrapper` (radius 16) — unwrapped icons visually shrink on focus.
