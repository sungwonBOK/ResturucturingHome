# 방 도면·가구·AI 추천 분리 UX 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 자유 형태 도면 편집부터 가구 배치, 스타일 선택, 읽기 전용 AI 추천 결과까지의 모바일 흐름을 독립 화면으로 제공한다.

**Architecture:** `draftId`를 모든 단계의 라우트 파라미터로 유지하고, 메모리 초안 저장소가 편집된 `RoomFloorPlan`을 갱신한다. 방 윤곽, 가구, 추천은 각각 `features/room-plan`, `features/furniture`, `features/recommendations`가 소유하며 화면은 조합과 라우팅만 담당한다.

**Tech Stack:** Expo Router, React Native, TypeScript, React Native Skia, react-native-gesture-handler, Expo Go, pnpm workspaces.

## Global Constraints

- 신규 의존성, Supabase 스키마, 인증, 영구 저장을 추가하지 않는다.
- `RoomFloorPlan`은 공통 타입의 유일한 도면 모델이며 좌표 단위는 cm다.
- 가구 타입별 UI 분기를 만들지 않고 `features/furniture/catalog`의 항목만으로 렌더링한다.
- AI 결과는 읽기 전용이며 초안의 가구·벽·개구부를 변경하거나 저장하지 않는다.
- 순수 편집 규칙과 저장소 변경에만 짧은 테스트를 추가한다. 실제 Expo Go 제스처·뒤로가기·추천 흐름은 사용자가 기기에서 확인한다.
- 기존 미커밋 파일과 개인 `.lnk` 파일을 삭제·스테이지·커밋하지 않는다.

---

### Task 1: 편집 초안 저장소와 단계 라우팅 계약

**Files:**
- Modify: `apps/mobile/src/features/scan/scanDraft.ts`
- Modify: `apps/mobile/src/features/scan/scanDraft.test.ts`
- Modify: `apps/mobile/app/(main)/_layout.tsx`
- Modify: `apps/mobile/app/(main)/scan.tsx`
- Modify: `apps/mobile/app/(main)/home.tsx`
- Create: `apps/mobile/src/features/workflow/workflowRoute.ts`

**Interfaces:**
- Consumes: `RoomFloorPlan`, Expo Router route params.
- Produces: `ScanDraftRepository.update(draftId: string, plan: RoomFloorPlan): boolean`, `getWorkflowRoute(name, draftId)`.

- [ ] Add a failing repository test proving an updated draft is returned by `get` and an unknown id returns `false`.
- [ ] Run the compiled focused test and confirm it fails because `update` does not exist.
- [ ] Add `update` to `ScanDraftRepository` and its memory implementation without mutating the caller's map entry under a different id.
- [ ] Run the focused test and confirm it passes.
- [ ] Add the four stack route names and route helpers; make Home and Scan create a draft then enter `room-plan-setup`.

### Task 2: 자유 형태 방 윤곽 모델과 도면 설정 화면

**Files:**
- Create: `apps/mobile/src/features/room-plan/model/roomOutline.ts`
- Create: `apps/mobile/src/features/room-plan/model/roomOutline.test.ts`
- Create: `apps/mobile/src/features/room-plan/ui/RoomPlanSetupEditor.tsx`
- Create: `apps/mobile/app/(main)/room-plan-setup.tsx`

**Interfaces:**
- Consumes: `RoomFloorPlan`, `ScanDraftRepository.update`.
- Produces: `getOutlineVertices(plan)`, `moveOutlineVertex(plan, vertexIndex, point)`, `validateRoomOutline(plan)` and a screen that only edits room geometry.

- [ ] Add a failing test for moving one vertex: the two adjacent walls remain connected, the wall ids remain stable, and the bounding `width`/`height` follow the resulting outline.
- [ ] Run the compiled focused test and confirm it fails because the outline model is absent.
- [ ] Implement ordered-vertex extraction, closed-wall reconstruction, adjacent-wall vertex movement, minimum wall length and self-intersection validation.
- [ ] Run the focused test and confirm it passes.
- [ ] Build the dedicated setup screen with numeric room size controls, vertex handles, validation message, draft update, and only the `가구 추가하기` CTA.

### Task 3: 가구 기능을 확장 가능한 폴더로 분리하고 모바일 제스처 수정

**Files:**
- Create: `apps/mobile/src/features/furniture/catalog/furnitureCatalog.ts`
- Create: `apps/mobile/src/features/furniture/catalog/getFurnitureCatalogItem.ts`
- Create: `apps/mobile/src/features/furniture/model/furnitureEditing.ts`
- Create: `apps/mobile/src/features/furniture/model/furnitureCanvasInteraction.ts`
- Create: `apps/mobile/src/features/furniture/ui/FurnitureCatalog.tsx`
- Create: `apps/mobile/src/features/furniture/ui/FurnitureCanvas.tsx`
- Create: `apps/mobile/src/features/furniture/ui/FurnitureEditor.tsx`
- Create: `apps/mobile/app/(main)/furniture-editor.tsx`
- Modify: `apps/mobile/src/features/room-editor/FurnitureEditor.tsx`
- Modify: `apps/mobile/src/features/room-editor/EditableFloorPlanCanvas.tsx`

**Interfaces:**
- Consumes: `RoomFloorPlan`, `FurnitureItem`, `FurnitureType`, `draftId`.
- Produces: catalog-driven `FurnitureEditor` and `FurnitureCanvas`; `onPlanChange(nextPlan)` updates the shared draft before route navigation.

- [ ] Preserve existing focused furniture tests and add one failing test showing a newly catalogued type can be created without a renderer-specific branch.
- [ ] Run the focused test and confirm it fails until catalog lookup is moved behind the catalog interface.
- [ ] Move catalog data and pure edit/interaction functions into the new feature folders, preserving ids, 30cm minimum size, rotation normalization, and rotated-boundary constraints.
- [ ] Replace direct `PanResponder` attachment on Skia `Canvas` with `GestureDetector` and transformed transparent touch overlays for selected furniture body, resize handle, and rotation handle.
- [ ] Run the existing focused furniture tests and mobile type check. Do not claim device gestures pass until Expo Go verification.
- [ ] Leave compatibility re-export modules only when an unchanged caller still needs them; otherwise delete no files and redirect new flow imports to `features/furniture`.

### Task 4: 스타일 선택과 읽기 전용 추천 결과 분리

**Files:**
- Create: `apps/mobile/src/features/recommendations/model/recommendationSession.ts`
- Create: `apps/mobile/src/features/recommendations/model/recommendationSession.test.ts`
- Create: `apps/mobile/src/features/recommendations/ui/RecommendationStyleSelection.tsx`
- Create: `apps/mobile/src/features/recommendations/ui/RecommendationResults.tsx`
- Create: `apps/mobile/app/(main)/recommendation-style.tsx`
- Create: `apps/mobile/app/(main)/recommendation-results.tsx`
- Modify: `apps/mobile/src/features/recommendations/RecommendationPanel.tsx`

**Interfaces:**
- Consumes: `RoomFloorPlan`, `RoomStyle`, `RecommendationService`.
- Produces: an in-memory session keyed by `draftId`, `requestRecommendations(draftId, plan, style)`, and `getRecommendations(draftId)`.

- [ ] Add a failing session test proving a changed plan clears a prior result and an older request token cannot replace the latest result.
- [ ] Run the compiled focused test and confirm it fails because the session model is absent.
- [ ] Implement the session model and exactly three style choices: `minimal`, `modern`, `nordic`.
- [ ] Run the focused test and confirm it passes.
- [ ] Move style selection and request progress/error/retry UI to `recommendation-style`; move three read-only recommendation diagrams and explanations to `recommendation-results`.
- [ ] Ensure neither screen calls draft update or room persistence.

### Task 5: 기존 단일 화면을 정리하고 흐름 검증

**Files:**
- Modify: `apps/mobile/app/(main)/room-editor.tsx`
- Modify: `apps/mobile/src/features/room-editor/RoomPersistencePanel.tsx`
- Modify: `apps/mobile/src/features/recommendations/RecommendationPanel.tsx`
- Modify: `docs/DOMAIN.md`

**Interfaces:**
- Consumes: the new four-route workflow.
- Produces: no entry path that displays setup, furniture, and recommendations together.

- [ ] Remove the old combined screen from normal navigation and make any remaining `room-editor` entry redirect to `room-plan-setup` with its `draftId`.
- [ ] Ensure persistence remains unavailable in the new recommendation flow and document the draft/result ownership boundaries.
- [ ] Run `pnpm --filter @restructuring-home/domain type-check`, `pnpm --filter mobile exec tsc --noEmit`, focused compiled tests, and `git diff --check`.
- [ ] Run Expo Go manually: create/edit free-form room, navigate to furniture, add/move/resize/rotate, choose a style, view three results, then use back navigation. Record any failed device interaction without changing scope speculatively.
