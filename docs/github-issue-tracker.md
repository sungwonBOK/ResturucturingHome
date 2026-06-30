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
