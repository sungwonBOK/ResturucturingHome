# Scan Draft Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** fixture 기반 scan 결과를 typed `RoomFloorPlan` draft로 정규화하여 `room-editor`로 전달한다.

**Architecture:** scan feature에 raw-result adapter와 메모리 `ScanDraftRepository`를 둔다. scan route는 plan 전체가 아닌 repository가 만든 `draftId`만 전달하고, room-editor route는 repository에서 조회한 typed plan을 기존 preview와 persistence panel에 전달한다.

**Tech Stack:** TypeScript, Expo Router, React Native, pnpm workspace, `@restructuring-home/domain`.

## Global Constraints

- native RoomPlan, ARCore, Expo native module, prebuild 설정을 추가하지 않는다.
- `RoomFloorPlan`은 `packages/domain/src/index.ts`의 타입만 사용한다.
- route parameter에는 `draftId`만 넣고 도면 JSON을 직렬화하지 않는다.
- 임시 draft는 앱 프로세스 수명이며, 재시작 복구는 구현하지 않는다.
- 기존 mock editor 진입은 fallback으로 보존한다.
- `.npmrc`의 `node-linker=hoisted`와 pnpm만 사용한다.
- focused TypeScript test는 저장소 밖 `C:\tmp\restructuringhome-issue5-tests`에 CommonJS로 컴파일 후 Node로 실행한다. 현재 저장소의 `.tmp`는 gitignore 대상이 아니므로 사용하지 않는다.

---

## File structure

- Create: `apps/mobile/src/features/scan/scanDraft.ts` — fixture raw result, generic adapter 경계, draft repository와 editor plan resolver.
- Create: `apps/mobile/src/features/scan/scanDraft.test.ts` — adapter 변환, create/get, unknown ID fallback, editor plan 선택의 순수 동작 테스트.
- Modify: `apps/mobile/app/(main)/scan.tsx` — fixture scan을 draft로 만들고 `draftId`만 포함해 이동.
- Modify: `apps/mobile/app/(main)/room-editor.tsx` — route draftId를 해석해 typed plan을 child component에 전달.

### Task 1: Scan draft domain boundary

**Files:**
- Create: `apps/mobile/src/features/scan/scanDraft.test.ts`
- Create: `apps/mobile/src/features/scan/scanDraft.ts`

**Interfaces:**
- Consumes: `RoomFloorPlan` from `@restructuring-home/domain`.
- Produces: `ScanResultAdapter<RawResult>`, `ScanDraftRepository`, `createMemoryScanDraftRepository`, `fixtureScanResult`, `fixtureScanResultAdapter`, `getRoomEditorPlan`.

- [x] **Step 1: Write the failing test**

```ts
const repository = createMemoryScanDraftRepository();
const plan = fixtureScanResultAdapter.toRoomFloorPlan(fixtureScanResult);
const draft = repository.create(plan);

assertEqual(plan.width, 360, 'fixture plan width');
assertEqual(repository.get(draft.id)?.height, 480, 'stored plan height');
assertEqual(getRoomEditorPlan('missing', repository, fallback), fallback, 'unknown draft fallback');
assertEqual(getRoomEditorPlan(draft.id, repository, fallback), plan, 'editor draft plan');
```

The production change `repository.get` always returning `undefined`, an adapter that loses cm dimensions, or an editor that ignores a valid `draftId` must make this test fail.

- [x] **Step 2: Run test to verify it fails**

Run:

```powershell
corepack pnpm --filter mobile exec tsc --module commonjs --moduleResolution node --target es2022 --esModuleInterop --skipLibCheck --outDir 'C:\tmp\restructuringhome-issue5-tests' --rootDir 'src' 'src/features/scan/scanDraft.test.ts'
node C:\tmp\restructuringhome-issue5-tests\features\scan\scanDraft.test.js
```

Expected: TypeScript fails because `scanDraft.ts` exports do not exist.

- [x] **Step 3: Write minimal implementation**

```ts
export interface ScanResultAdapter<RawResult> {
  toRoomFloorPlan(rawResult: RawResult): RoomFloorPlan;
}

export interface ScanDraftRepository {
  create(plan: RoomFloorPlan): ScanDraft;
  get(draftId: string): RoomFloorPlan | undefined;
}

export function getRoomEditorPlan(
  draftId: string | undefined,
  repository: ScanDraftRepository,
  fallbackPlan: RoomFloorPlan,
): RoomFloorPlan {
  return (draftId ? repository.get(draftId) : undefined) ?? fallbackPlan;
}
```

Implement fixture raw-to-plan field mapping and a monotonic in-memory `scan-draft-<number>` ID. Keep no React state or platform SDK dependency in this file.

- [x] **Step 4: Run test to verify it passes**

Run the Step 2 command. Expected: Node exits with code 0 and no assertion output.

### Task 2: Route integration

**Files:**
- Modify: `apps/mobile/app/(main)/scan.tsx`
- Modify: `apps/mobile/app/(main)/room-editor.tsx`

**Interfaces:**
- Consumes: `fixtureScanResult`, `fixtureScanResultAdapter`, `scanDraftRepository`, `getRoomEditorPlan` from `scanDraft.ts`.
- Produces: scan-to-editor route with a `draftId` string and editor props typed as `RoomFloorPlan`.

- [x] **Step 1: Write minimal route integration**

```ts
const draft = scanDraftRepository.create(
  fixtureScanResultAdapter.toRoomFloorPlan(fixtureScanResult),
);
router.push({ pathname: '/(main)/room-editor', params: { draftId: draft.id } });
```

```ts
const { draftId } = useLocalSearchParams<{ draftId?: string | string[] }>();
const selectedDraftId = typeof draftId === 'string' ? draftId : undefined;
const plan = getRoomEditorPlan(selectedDraftId, scanDraftRepository, mockStudioFloorPlan);
```

Pass `plan` to both `FloorPlanPreview` and `RoomPersistencePanel`. If a requested ID is missing, show concise copy explaining that the temporary draft expired and the sample plan is shown.

- [x] **Step 2: Run static integration check**

Run:

```powershell
corepack pnpm --filter mobile exec tsc --noEmit
```

Expected: TypeScript accepts the Expo Router parameter shape and both editor children receive a `RoomFloorPlan`.

### Task 3: Static and manual verification

**Files:**
- Modify: `docs/superpowers/plans/2026-08-07-scan-draft-ingestion.md` (mark completed steps only after evidence is collected)

**Interfaces:**
- Consumes: completed Task 1 and Task 2 code.
- Produces: recorded automated evidence and an explicit remaining Expo Go gate.

- [x] **Step 1: Run focused draft test**

Run the Task 1 compile-and-Node command. Expected: Node exits 0.

- [x] **Step 2: Run static checks**

```powershell
corepack pnpm --filter mobile exec tsc --noEmit
corepack pnpm --filter @restructuring-home/domain type-check
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 3: Perform or hand off the manual Expo Go check**

Open Scan, tap the scan completion action, and verify that editor preview dimensions and the persistence panel use the fixture draft rather than the direct-entry sample. Also verify an app reload or an unknown `draftId` shows the sample fallback and expiry copy. This is intentionally manual because a React Native route test would require an unconfigured test runtime and would be larger than this feature's pure boundary test.

- [ ] **Step 4: Commit**

```powershell
git add -- apps/mobile/app/(main)/scan.tsx apps/mobile/app/(main)/room-editor.tsx apps/mobile/src/features/scan/scanDraft.ts apps/mobile/src/features/scan/scanDraft.test.ts docs/superpowers/plans/2026-08-07-scan-draft-ingestion.md
git commit -m "feat: ingest scan floor plan drafts"
```

Do not stage `RestructuringHome - 바로 가기.lnk`.
