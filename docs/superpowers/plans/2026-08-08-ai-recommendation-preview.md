# AI Recommendation Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 인증된 모바일 사용자가 도면과 스타일로 AI 배치 3개를 요청하고 room-editor에서 미리 보게 한다.

**Architecture:** Edge Function은 계약 검증, OpenAI HTTP client, HTTP handler를 분리한다. 모바일은 Function 호출 서비스와 표시 UI를 분리하며, 추천은 반환만 하고 저장하지 않는다.

**Tech Stack:** Supabase Edge Functions (Deno TypeScript), OpenAI Responses API, Expo Router, React Native, `@restructuring-home/domain`.

## Global Constraints

- `OPENAI_API_KEY`는 Function secret으로만 읽고 모바일 코드·Expo 환경 변수·git에 넣지 않는다.
- 배포 시 Function JWT 검증을 활성화한다.
- 요청은 `RoomFloorPlan`, `RoomStyle`, 선택적 HTTPS `screenshotUrl`이고 응답은 정확히 3개의 `RecommendationLayout`이다.
- 자동 저장, recommendations 테이블 쓰기, roomId 연결, 이미지 업로드를 구현하지 않는다.
- 테스트 출력은 저장소 밖 `C:\tmp\restructuringhome-issue6-tests`만 사용한다.

---

### Task 1: Function contracts and response parser

**Files:**
- Create: `supabase/functions/get-recommendations/contracts.ts`
- Create: `supabase/functions/get-recommendations/contracts.test.ts`

**Interfaces:**
- Produces: `RecommendationRequest`, `parseRecommendationRequest`, `parseRecommendationLayouts`, `RecommendationContractError`.

- [x] Write a failing Node-compiled test that accepts a valid floor plan/style, rejects a missing style, rejects a non-HTTPS image URL, and rejects an OpenAI payload with two layouts.
- [x] Compile the test with `node node_modules/typescript/bin/tsc --module commonjs --moduleResolution node --target es2022 --lib es2022,dom --esModuleInterop --skipLibCheck --outDir C:\tmp\restructuringhome-issue6-tests --rootDir supabase/functions/get-recommendations supabase/functions/get-recommendations/contracts.test.ts`, then run its emitted Node file. Expected RED: missing exports.
- [x] Implement only the request/output validators. Every returned furniture item must have a supported type, finite geometry, and rotation; every layout must match the requested style.
- [x] Re-run the same command. Expected GREEN: exit code 0.

### Task 2: OpenAI request boundary

**Files:**
- Create: `supabase/functions/get-recommendations/openai-client.ts`
- Create: `supabase/functions/get-recommendations/openai-client.test.ts`

**Interfaces:**
- Consumes: `RecommendationRequest` and `parseRecommendationLayouts`.
- Produces: `createOpenAIRecommendationClient({ apiKey, fetch })` with `recommend(request): Promise<unknown>`; `index.ts` passes that JSON to the contracts parser.

- [x] Write a failing test with a supplied `fetch` fake that verifies the server `Authorization` header, `gpt-4o` request model, selected style prompt, and optional image input omission/inclusion.
- [x] Run the Task 1 compiler against this test. Expected RED: missing module.
- [x] Implement a narrow Responses API HTTP client. Require a non-empty API key, reject non-OK responses without exposing upstream details, and extract model JSON text. The HTTP handler passes that JSON through `parseRecommendationLayouts`.
- [x] Re-run the test. Expected GREEN: exit code 0.

### Task 3: Authenticated Function HTTP handler

**Files:**
- Modify: `supabase/functions/get-recommendations/index.ts`

**Interfaces:**
- Consumes: parsed request and `createOpenAIRecommendationClient`.
- Produces: JSON `{ recommendations }`, HTTP 400 for contract failures, 500 for missing secret, and 502 for upstream/model failures.

- [x] Keep `OPTIONS` CORS handling and JSON content responses in the handler.
- [x] Read `OPENAI_API_KEY` from `Deno.env`; never log it. For valid POST JSON, call the client and return the validated three layouts.
- [x] Type-check function sources with the Task 1 TypeScript compiler command. Deployment and live invoke stay separate because the local machine has no Deno/Supabase CLI runtime.

### Task 4: Mobile function service and preview panel

**Files:**
- Create: `apps/mobile/src/features/recommendations/recommendationService.ts`
- Create: `apps/mobile/src/features/recommendations/recommendationService.test.ts`
- Create: `apps/mobile/src/features/recommendations/RecommendationPanel.tsx`
- Modify: `apps/mobile/app/(main)/room-editor.tsx`

**Interfaces:**
- Consumes: `RoomFloorPlan`, `RoomStyle`, `RecommendationLayout`, and the existing Supabase client.
- Produces: `requestRecommendations(plan, style)` and a panel that requests then displays three returned layouts.

- [x] Write a failing service test with an injected Function client that verifies `get-recommendations` receives `{ floorPlan, style }`, returns three layouts, and throws a friendly error on Function failure.
- [x] Compile/run it into `C:\tmp\restructuringhome-issue6-tests`. Expected RED: missing service module.
- [x] Implement the service around `supabase.functions.invoke`, with a small injected-client factory for testing and response validation.
- [x] Implement the Deep Navy panel: four style buttons, one request button, loading/error state, and three read-only recommendation cards. It receives the current editor plan as a prop and owns no persistence state.
- [x] Insert the panel in room-editor and pass its resolved typed `plan`.
- [x] Re-run the focused service test. Expected GREEN: exit code 0.

### Task 5: Verification and handoff

- [x] Run all three focused Node-compiled test files, mobile `tsc --noEmit`, domain type-check, Function source type-check, and `git diff --check`.
- [x] Set `OPENAI_API_KEY` as a Supabase secret, deploy with JWT verification, then verify in Expo Go with real Auth that one style request displays three cards.
- [x] Commit only Issue #6 files; exclude `RestructuringHome - 바로 가기.lnk`.
