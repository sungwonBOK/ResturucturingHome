# Skia Floor Plan Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the temporary RN View floor-plan preview with a Skia Canvas renderer backed by `RoomFloorPlan`.

**Architecture:** Keep `RoomFloorPlan` as the source data. Add a pure geometry helper that maps room coordinates in centimeters to fitted canvas coordinates, then render the computed draw primitives through `@shopify/react-native-skia`.

**Tech Stack:** Expo SDK 54, React Native 0.81, TypeScript, `@shopify/react-native-skia`, pnpm workspaces.

---

### Task 1: Add Skia Dependency

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Install Skia with Expo-compatible version**

Run:

```powershell
pnpm --filter mobile exec expo install @shopify/react-native-skia
```

Expected: package and lockfile update without Expo compatibility errors.

- [ ] **Step 2: Verify dependency health**

Run:

```powershell
pnpm --filter mobile exec expo install --check
```

Expected: `Dependencies are up to date`.

---

### Task 2: Add Canvas Geometry Helper With Test First

**Files:**
- Create: `apps/mobile/src/features/room-editor/floorPlanCanvasGeometry.ts`
- Create or modify: `apps/mobile/src/features/room-editor/floorPlanCanvasGeometry.test.ts`

- [ ] **Step 1: Write the failing test**

Create a test that imports `mockStudioFloorPlan` and expects a 300x360 canvas to fit a 360x480 room at scale `0.75`, horizontal offset `15`, vertical offset `0`, four wall draw items, two opening draw items, and three furniture draw items.

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```powershell
pnpm --filter mobile exec tsc src/features/room-editor/floorPlanCanvasGeometry.test.ts --module commonjs --target es2020 --moduleResolution node --outDir C:\tmp\restructuringhome-skia-geometry-test --skipLibCheck --esModuleInterop
```

Expected: TypeScript fails because `floorPlanCanvasGeometry` does not exist.

- [ ] **Step 3: Implement minimal geometry helper**

Add `getFloorPlanCanvasGeometry(plan, canvasWidth, canvasHeight)` that returns:
- `scale`
- `offsetX`
- `offsetY`
- `walls`
- `openings`
- `furniture`

Each draw item must expose coordinates in canvas pixels, not percentages.

- [ ] **Step 4: Run focused test to verify GREEN**

Run:

```powershell
pnpm --filter mobile exec tsc src/features/room-editor/floorPlanCanvasGeometry.test.ts --module commonjs --target es2020 --moduleResolution node --outDir C:\tmp\restructuringhome-skia-geometry-test --skipLibCheck --esModuleInterop
node C:\tmp\restructuringhome-skia-geometry-test\features\room-editor\floorPlanCanvasGeometry.test.js
```

Expected: both commands exit 0.

---

### Task 3: Replace RN View Renderer With Skia Canvas

**Files:**
- Modify: `apps/mobile/src/features/room-editor/FloorPlanPreview.tsx`
- Reuse: `apps/mobile/src/features/room-editor/floorPlanCanvasGeometry.ts`
- Reuse: `apps/mobile/src/features/room-editor/floorPlanPreviewMetrics.ts`

- [ ] **Step 1: Import Skia primitives**

Use `Canvas`, `Group`, `Rect`, `RoundedRect`, `Line`, and `Text`/fallback label handling only where practical. Keep RN `Text` for metrics below the canvas.

- [ ] **Step 2: Render fixed fitted canvas**

Use `onLayout` to get container width, derive canvas height from room aspect ratio with a maximum of 360, and pass dimensions into `getFloorPlanCanvasGeometry`.

- [ ] **Step 3: Render primitives**

Render:
- walls as Skia lines with stroke width from wall thickness
- doors/windows as colored rounded rects
- furniture as rounded rects with labels rendered in RN overlay only if Skia text/font setup would add unnecessary scope

- [ ] **Step 4: Preserve existing metrics**

Keep the metric row for size, wall count, opening count, and furniture count.

---

### Task 4: Verify and Publish

**Files:**
- Modify: `docs/progress.md`
- Modify: `docs/github-issue-tracker.md` only if tracker status changes locally

- [ ] **Step 1: Run verification**

Run:

```powershell
pnpm --filter mobile exec expo install --check
pnpm --filter mobile exec tsc --noEmit
pnpm --filter @restructuring-home/domain type-check
```

Expected: all commands exit 0.

- [ ] **Step 2: Update GitHub issue**

Comment on issue #3 with summary and verification results. Close #3 only when the criteria are satisfied.

- [ ] **Step 3: Commit and push**

Run:

```powershell
git status --short --branch
git add apps/mobile/package.json pnpm-lock.yaml apps/mobile/src/features/room-editor docs/progress.md docs/superpowers/plans/2026-06-30-skia-floor-plan-editor.md
git commit -m "Add Skia floor plan preview"
git push
```

Expected: remote `main` contains the implementation commit.

---

## Self-Review

- #3 requires Skia rendering of walls, doors, windows, and furniture: covered by Task 3.
- #3 requires readable mobile fit: covered by Task 2 geometry and Task 3 fitted canvas.
- #3 requires TypeScript checks: covered by Task 4.
- `RoomFloorPlan` remains source of truth: geometry helper accepts `RoomFloorPlan` directly.
