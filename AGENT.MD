# RestructuringHome Agent Guide

You are working on `RestructuringHome`, an AI-powered one-room interior layout recommendation app.
This repository uses a monorepo structure utilizing **pnpm workspaces**. 

Before starting any new task, **read these files in order**:
1. `README.md` (Project structure and tech stack)
2. `docs/progress.md` (Recent progress and next steps)
3. `docs/DOMAIN.md` (Core domain logic and algorithms)

## 🌐 AI Communication & Developer Rules
- **Language**: All communication, explanations, and code comments directed to the user MUST be in **Korean**.
- **UX/UI Standard**: Keep the interface feeling "Premium". Adhere to the established **Deep Navy (Slate) Dark Theme** (e.g. `bg: '#0F172A'`). Avoid reverting to pure black or old color schemes.
- **Dependency Flow**: DO NOT use `npm` or `yarn`. Use **pnpm**.

## 🏗️ Pragmatic Architecture Guidelines
본 프로젝트는 2D(Skia)와 3D(Fiber)가 공존하는 시각적이고 인터랙티브한 앱이므로 교과서적인 아키텍처보다는 **현실적이고 유연한 설계**를 지향합니다.

- **데이터 기반의 함수형 설계 (Data-Driven)**: 도면(Room, Wall)은 직렬화하기 쉬운 순수 JSON 타입으로 정의하고, 상태 관리는 Zustand 같은 스토어나 순수 함수를 활용하는 것이 React 생태계와 훨씬 더 부드럽게 맞물립니다.
- **응집도 높은 UI와 렌더링 (Cohesive Rendering)**: Skia(2D)와 Three.js(3D)는 각 엔진의 특성을 온전히 살릴 수 있도록 추상화로 묶기보다는 해당 엔진에 특화된 컴포넌트로 작업하는 것이 프레임 확보와 성능 최적화에 유리합니다. 단, 두 렌더러가 바라보는 상태(Store)는 단일 데이터(가구의 위치 등)로 통일합니다.
- **선택적인 인터페이스 활용 (Selective Abstraction)**: 플랫폼별 차이가 큰 네이티브 스캐너(iOS RoomPlan, Android ARCore) 등은 결과물이 동일하도록 명확한 공통 인터페이스(`ex: startScan()`)를 설계하여 확장성에 대비합니다.
- **기능 중심의 자연스러운 분리**: 코드를 처음 작성할 때부터 미래의 확장성을 고려하되, 무리하게 쪼개기보다는 연관된 제스처와 애니메이션이 모여 있어 한눈에 읽히기 편한 구조(높은 응집도)를 만드는 것을 우선시합니다.
## Product Facts
- Scope: one room MVP
- Platforms: iOS and Android
- Scan flow on both platforms: automatic first draft -> user correction -> AI recommendation -> 3D preview
- iOS scan stack: `Swift + RoomPlan` (Custom Expo Module)
- Android scan stack: `Kotlin + ARCore` (Custom Expo Module)
- App shell: `React Native + Expo` (Bare Workflow + `expo-router`)
- Shared types: `packages/domain`
- Server/Auth: `Supabase Auth`, `Supabase Postgres`, `Supabase Storage`, `Supabase Edge Functions`
- AI Rules: OpenAI API keys must NEVER be shipped inside the mobile app. All AI requests must go through Supabase Edge Functions.

## Repository Structure & Pnpm Workspaces

```text
RestructuringHome/
  apps/
    mobile/                  # Expo React Native app
  packages/
    domain/                  # Shared room/layout/furniture types
  supabase/
    functions/               # OpenAI proxy and server functions
    migrations/              # Database schema changes
  docs/
    DOMAIN.md                # Domain logic, algorithmic explanations
    progress.md              # Live tracking of progress
  pnpm-workspace.yaml        # Workspaces definition
  .npmrc                     # Contains "node-linker=hoisted" (CRITICAL for RN)
```

**CRITICAL PNPM RULE**: This project uses `node-linker=hoisted` in `.npmrc` to prevent duplicate React instances. Do not switch to `npm workspaces` or remove the hoisted setting, otherwise Metro bundler will fail.

## Directory Responsibilities

### `apps/mobile`
- Frontend logic, UI, and Expo Native Modules.
- Strict `expo-router` screen hierarchy (`app/(auth)`, `app/(main)`).
- UI uses `expo-linear-gradient` and curated color tokens in `src/theme/colors.ts`.

### `packages/domain`
- Source of truth for room JSON schema, layouts, and furniture types.
- Changes impacting scanning output or AI inputs should happen here first.

### `supabase/`
- Centralizes all DB structures via PostgreSQL migrations.

## Current Implementation Status
- Root workspace is fully configured using `pnpm` + `hoisted` settings.
- `apps/mobile` is integrated with Supabase Auth (SecureStorage).
- `expo-router` is implemented with protective routing (redirects to Login if unauthenticated).
- High-fidelity **Deep Navy Dark Mode** Home and Auth screens UI is built. 
- Supabase Project is remotely created and `.env` is loaded with API keys.

## How to resume effectively in a new thread
- Read `docs/progress.md` to see exactly where we left off.
- If implementing new math or logic (e.g. Skia 2D positioning), document the "Why" in `docs/DOMAIN.md`.
- Ask for user approval before generating complex chunks of code.

## Near-term Priorities (Handoff candidates)
1. Complete `(main)` stack navigation (Tabs or Stack) for Home, Scan process, Room details.
2. Initialize and build the 2D Floorplan Editor using `@shopify/react-native-skia`.
3. Integrate the native iOS RoomPlan SDK into a custom Expo module.
4. Integrate the OpenAI Vision Edge Function logic and display AI responses.