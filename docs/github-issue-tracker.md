# GitHub Issue Tracker Draft

Target repository: `sungwonBOK/ResturucturingHome`

Created with GitHub CLI on 2026-06-30.

## Created Issues
- Tracker: https://github.com/sungwonBOK/ResturucturingHome/issues/8
- Done: Expo SDK 54 patch warning stabilization: https://github.com/sungwonBOK/ResturucturingHome/issues/1
- Done: Connect mock `RoomFloorPlan` to `room-editor`: https://github.com/sungwonBOK/ResturucturingHome/issues/2
- Done: Replace RN preview with Skia floor-plan editor: https://github.com/sungwonBOK/ResturucturingHome/issues/3
- Next: Persist `RoomFloorPlan` to Supabase `rooms`: https://github.com/sungwonBOK/ResturucturingHome/issues/4
- Next: Implement scan result ingestion flow: https://github.com/sungwonBOK/ResturucturingHome/issues/5
- Next: Implement OpenAI recommendation Edge Function: https://github.com/sungwonBOK/ResturucturingHome/issues/6
- Next: Add basic room list/detail data flow: https://github.com/sungwonBOK/ResturucturingHome/issues/7

---

## Tracker: RestructuringHome MVP Roadmap

### Status
Active tracker for the current MVP.

### 2026-07-01 Progress Update
- App boot now reaches the login screen in Expo Go after adding an explicit root route at `apps/mobile/app/index.tsx`.
- Hardened root auth initialization in `apps/mobile/app/_layout.tsx` with Supabase `getSession()` timeout fallback, error handling, font-load fallback, and auth subscription cleanup.
- Added a development-only local admin bypass login for Expo testing.
  - Implemented in `apps/mobile/src/services/devAuth.ts`
  - Credentials are read from ignored local `.env` values and are not documented in the tracker.
- Updated auth screens to surface network failures instead of throwing unhandled runtime errors.
- Current Supabase Auth issue remains open: iOS runtime reports `Network request failed` for real sign-up/login.
- Direct investigation found the linked Supabase project `rwojodlsrhklnjweevfm` was `INACTIVE`; it has now been restored to `ACTIVE_HEALTHY`, email auth is enabled, and direct API/Auth checks respond again.
- Supabase logs now show successful `/auth/v1/settings` and `/rest/v1/rooms` requests after restore.
- Non-mutating invalid auth checks now reach Supabase Auth: invalid password login reaches/logs `/auth/v1/token` with `400 invalid_credentials`, and invalid email signup reaches/logs `/auth/v1/signup` with `400 validation_failed`.
- Added the Supabase React Native runtime setup: URL polyfill, AsyncStorage-backed auth session persistence, auth `processLock`, and native AppState auto-refresh handling.
- Locked down Supabase table access with migration `20260630162523_lock_down_room_policies`: anon table access is revoked, client `TRUNCATE`/trigger/reference grants are removed, and RLS policies now target `authenticated` with explicit ownership checks.
- Remote rollback verification confirms the authenticated ownership policy path: own room is visible (`own_visible_count=1`), another user claim cannot see it (`other_visible_count=0`), and verification rows were rolled back.
- A real public signup test is blocked by Supabase email send rate limiting (`429 over_email_send_rate_limit`); a manually inserted Auth row was cleaned up and not counted as proof because password login returned `invalid_credentials`.
- Replaced direct Expo SecureStore session persistence with the official React Native AsyncStorage pattern because Expo SecureStore cannot store values larger than 2048 bytes; dev admin still uses SecureStore only for its small local bypass flag.
- If iPhone auth still fails, debug from fresh device-side logs before adding more client code.
- Dev admin mock save now uses a local in-memory persistence path instead of calling Supabase without a real Auth session.
- The earlier `newArchEnabled: false` local experiment was reverted; `apps/mobile/app.json` no longer carries that Expo Go-only experiment.

### Completed
- [ ] Expo SDK 54 patch warning stabilization
- [ ] Connect mock `RoomFloorPlan` to `room-editor`

### Next
- [x] Replace RN preview with Skia floor-plan editor
- [ ] Persist `RoomFloorPlan` to Supabase `rooms`
- [ ] Implement scan result ingestion flow
- [ ] Implement OpenAI recommendation Edge Function
- [ ] Add basic room list/detail data flow

### Current Verification Baseline
- `pnpm --filter mobile exec expo install --check`
- `pnpm --filter mobile exec tsc --noEmit`
- `pnpm --filter @restructuring-home/domain type-check`

### Latest Local Verification
- `node node_modules/typescript/bin/tsc --noEmit -p apps/mobile/tsconfig.json`: passed
- `corepack pnpm --filter mobile exec node ../../node_modules/typescript/bin/tsc --noEmit`: passed
- Manual Expo Go check: login screen is reachable; dev admin login unblocks UI navigation.

---

## Done: Expo SDK 54 patch warning stabilization

### Status
Done.

### Background
Expo warned that several SDK 54 package patch versions were behind the expected versions. A stale app-local `node_modules` also shadowed the root pnpm hoisted dependency tree.

### Completed Work
- Updated `expo` to `~54.0.35`
- Updated `expo-font` to `~14.0.12`
- Updated `expo-linking` to `~8.0.12`
- Updated `expo-router` to `~6.0.24`
- Added `react-dom@19.1.0` to align Expo Router's optional web peer with `react@19.1.0`
- Moved stale `apps/mobile/node_modules` to `C:\tmp\restructuringhome-mobile-node_modules-stale-20260629-1624`

### Verification
- `pnpm --filter mobile exec expo install --check`: passed
- `pnpm --filter mobile exec tsc --noEmit`: passed
- `pnpm --filter @restructuring-home/domain type-check`: passed

### Related Files
- `apps/mobile/package.json`
- `pnpm-lock.yaml`
- `docs/progress.md`

---

## Done: Connect mock RoomFloorPlan to room-editor

### Status
Done.

### Background
The `room-editor` screen was a static placeholder. The next step before real Skia editing was to connect typed mock `RoomFloorPlan` state into the screen.

### Completed Work
- Added `@restructuring-home/domain` as a mobile workspace dependency
- Added typed mock fixture: `apps/mobile/src/mocks/mockRoomFloorPlan.ts`
- Added preview metrics helper: `apps/mobile/src/features/room-editor/floorPlanPreviewMetrics.ts`
- Added RN View preview component: `apps/mobile/src/features/room-editor/FloorPlanPreview.tsx`
- Connected the mock preview to `apps/mobile/app/(main)/room-editor.tsx`
- Added focused metric assertion file: `apps/mobile/src/features/room-editor/floorPlanPreview.test.ts`

### Verification
- `pnpm --filter mobile exec tsc --noEmit`: passed
- Focused floor-plan metric assertion compiled and executed from `C:\tmp\restructuringhome-floorplan-test`: passed

---

## Next: Replace RN preview with Skia floor-plan editor

### Goal
Replace the temporary RN View preview with a real Skia-based 2D floor-plan editor.

### Scope
- Render walls, doors, windows, and furniture from `RoomFloorPlan`
- Support pan/zoom or stable fitting for one-room layouts
- Prepare interaction boundaries for furniture move/resize/rotate
- Keep `RoomFloorPlan` as the single source of truth

### Acceptance Criteria
- The existing mock room renders through Skia
- The preview remains readable on mobile viewport sizes
- `pnpm --filter mobile exec tsc --noEmit` passes
- Domain type-check still passes

---

## Next: Persist RoomFloorPlan to Supabase rooms

### Goal
Save and load room floor-plan JSON through Supabase `rooms`.

### Scope
- Define a mobile-side room save/load service
- Persist `RoomFloorPlan` JSON without exposing secrets
- Connect saved room records to the current user
- Keep RLS-compatible behavior

### Acceptance Criteria
- Authenticated user can save a mock `RoomFloorPlan`
- Saved room can be loaded back into the app
- No OpenAI or service role keys are shipped in mobile code

### Current Implementation
- Added a mobile room persistence service using the existing public Supabase client and authenticated user session.
- Connected the mock floor-plan save/load flow to `room-editor`.
- Added a focused service assertion for insert payload, load mapping, and dev/mock in-memory persistence.
- Dev admin sessions now save/load the mock floor plan through local in-memory persistence instead of Supabase.
- Supabase client now includes the official React Native runtime setup, including AsyncStorage-backed session persistence, guarded by a focused source-level regression test.
- Supabase room policies are now guarded by a focused schema regression test and applied to the linked project.
- Pending before closing GitHub issue #4: verify the authenticated save/load round-trip from an iOS or Android device or simulator session.

---

## Next: Implement scan result ingestion flow

### Goal
Connect scan output placeholders to the shared `RoomFloorPlan` schema.

### Scope
- Keep iOS RoomPlan and Android ARCore outputs behind a future adapter boundary
- For now, model the conversion point from raw scan result to `RoomFloorPlan`
- Route scan completion into `room-editor`

### Acceptance Criteria
- `scan -> room-editor` can pass or select a floor-plan draft
- The editor receives a typed `RoomFloorPlan`
- Future native module adapters can plug into the same shape

---

## Next: Implement OpenAI recommendation Edge Function

### Goal
Generate layout recommendations through Supabase Edge Functions, never from the mobile app directly.

### Scope
- Implement `supabase/functions/get-recommendations/index.ts`
- Accept `RoomFloorPlan`, selected style, and optional screenshot/image reference
- Return `RecommendationLayout[]`
- Keep OpenAI API keys server-side only

### Acceptance Criteria
- Function validates required input
- Mobile app calls Supabase function, not OpenAI directly
- Returned recommendations match `packages/domain` types

---

## Next: Add basic room list/detail data flow

### Goal
Move from placeholder home/detail screens toward real room records.

### Scope
- Replace empty `MOCK_ROOMS` home state with loaded room summaries
- Open a selected room detail
- Preserve the premium Deep Navy theme

### Acceptance Criteria
- Home displays saved room cards
- Room detail can navigate back to editor
- TypeScript checks pass
