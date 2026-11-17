# Canvas Scroll Lock and Single Recommendation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 도면·가구 캔버스의 드래그가 상위 화면 스크롤로 넘어가지 않게 하고, 선택한 추천 종류의 대표 배치 하나만 보여준다.

**Architecture:** 두 캔버스가 같은 순수 제스처 정책을 사용해 캔버스 내부 시작·이동을 점유하고 ScrollView로의 responder 양도를 거절한다. 기존 Edge Function의 스타일별 세 후보 계약은 유지하고, 추천 세션이 첫 후보만 대표 결과로 저장해 결과 UI가 하나의 도면만 렌더링한다.

**Tech Stack:** Expo Router, React Native PanResponder, React Native ScrollView, TypeScript, React Native Skia, pnpm workspaces.

## Global Constraints

- 캔버스 밖의 화면 드래그는 기존 `MainFlowScreen` ScrollView가 계속 처리한다.
- 새 의존성, Supabase 스키마, Edge Function 계약 또는 배포를 추가하지 않는다.
- 추천 종류는 `minimal`, `modern`, `nordic` 세 개를 유지한다.
- 서버가 반환한 세 후보 중 첫 번째만 선택한 종류의 대표 배치로 표시하며, 원본 초안은 수정하지 않는다.
- 기존 미커밋 파일과 개인 `.lnk` 파일을 삭제·스테이지·커밋하지 않는다.

---

### Task 1: 캔버스 스크롤 점유 정책

**Files:**
- Create: `apps/mobile/src/features/room-editor/canvasGesturePolicy.ts`
- Create: `apps/mobile/src/features/room-editor/canvasGesturePolicy.test.ts`
- Modify: `apps/mobile/src/features/room-editor/EditableFloorPlanCanvas.tsx`
- Modify: `apps/mobile/src/features/room-plan/ui/RoomPlanSetupEditor.tsx`

**Interfaces:**
- Produces: `getCanvasGesturePolicy(): { capturesStart: true; capturesMove: true; allowsTermination: false }`.
- Consumes: both existing `PanResponder.create` calls.

- [x] Write a failing compiled test that expects an in-canvas drag to capture start and move events and reject parent takeover.
- [x] Run the focused compile and confirm it fails because the policy module is absent.
- [x] Add the immutable policy helper and wire `onStartShouldSetPanResponder`, `onMoveShouldSetPanResponder`, and `onPanResponderTerminationRequest` in both canvases to it.
- [x] Re-run the focused test; confirm it passes.

### Task 2: 선택 종류의 단일 추천 결과

**Files:**
- Modify: `apps/mobile/src/features/recommendations/model/recommendationSession.ts`
- Modify: `apps/mobile/src/features/recommendations/model/recommendationSession.test.ts`
- Modify: `apps/mobile/src/features/recommendations/ui/RecommendationStyleSelection.tsx`
- Modify: `apps/mobile/src/features/recommendations/ui/RecommendationResults.tsx`
- Modify: `apps/mobile/app/(main)/recommendation-style.tsx`
- Modify: `apps/mobile/app/(main)/recommendation-results.tsx`

**Interfaces:**
- Produces: `RecommendationSessionEntry.recommendation?: RecommendationLayout` and `complete(draftId, requestVersion, recommendations)` that stores only `recommendations[0]` for the latest request.
- Consumes: existing `RecommendationService` response of exactly three layouts.

- [x] Extend the session test with three literal layouts and assert a completed request exposes only the first representative layout, while a new request clears it and stale completion remains rejected.
- [x] Run the compiled focused test and confirm it fails because the entry does not have a single representative result.
- [x] Store the first returned layout as `recommendation`; remove the UI dependency on the candidate array; adjust Korean copy to describe three kinds and one selected diagram.
- [x] Re-run the focused test and confirm it passes.

### Task 3: Integration checks

**Files:**
- Modify: `docs/superpowers/specs/2026-08-15-room-layout-workflow-design.md`

- [x] Run the two focused compiled tests, `pnpm --filter @restructuring-home/domain type-check`, `pnpm --filter mobile exec tsc --noEmit`, and `git diff --check`.
- [ ] Manually verify in Expo Go that canvas touches do not scroll the parent, outside drags do scroll it, each of the three recommendation kinds opens one diagram, and the original editable plan remains unchanged.
