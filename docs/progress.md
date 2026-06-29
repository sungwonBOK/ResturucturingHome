# Progress — RestructuringHome

## 2026-04-03

### ✅ Phase 0: 프로젝트 기반 완성

#### 모노레포 구조 (pnpm workspaces)
- `pnpm-workspace.yaml` + `.npmrc (node-linker=hoisted)` 설정 완료
- npm workspaces → pnpm으로 전환
  - **이유**: npm workspaces에서 react/react-native가 서로 다른 node_modules에 설치되어 "Invalid hook call" 오류 발생
  - pnpm hoisted 모드는 루트에 패키지를 하나씩만 설치하여 중복 인스턴스 원천 차단

#### Expo 앱 초기화 (apps/mobile)
- Expo SDK 54 + TypeScript 템플릿으로 생성
- `expo-router` v4 설정 (파일 기반 라우팅)
- `app.json`: 앱 이름 `RestructuringHome`, scheme `restructuringhome`, 다크모드 설정
- `metro.config.js`: 모노레포 경로 설정 (watchFolders, nodeModulesPaths)

#### 설치된 주요 패키지
- `expo-router` — 파일 기반 라우팅
- `react-native-safe-area-context` — SafeArea 처리
- `react-native-screens` — 네이티브 화면 전환
- `expo-linear-gradient` — 그라디언트 UI
- `@expo-google-fonts/inter` + `expo-font` — Inter 폰트
- `expo-splash-screen` — 스플래시 화면

#### 공통 타입 (packages/domain)
- `RoomFloorPlan`, `Wall`, `Opening`, `FurnitureItem`, `RecommendationLayout` 타입 정의
- iOS/Android 스캔 결과 모두 이 스키마로 변환 예정

#### Supabase 기초
- `migrations/001_initial_schema.sql`: rooms, recommendations 테이블 + RLS 정책
- `functions/get-recommendations/index.ts`: OpenAI 호출 플레이스홀더

---

### ✅ 홈 화면 UI 개편 및 고도화
- **색상 테마 변경**: 시인성이 낮은 기존 퍼플 다크 테마에서 **Deep Navy (Slate) 기반 컬러(Slack/Linear 스타일)**로 밝은 다크 테마 적용
- **디자인 개선**: 로고 그라디언트 아이콘 추가, 단계별 카드에 설명(Description) 텍스트 노출, 보조 CTA 버튼(사진으로 시작하기) 추가

---

### ✅ Phase 1: Supabase 클라우드 & Auth 연동

#### Supabase 프로젝트 생성 및 설정
- Supabase CLI 연동 (`npx supabase login`)
- 원격 프로젝트 `RestructuringHome` 자동 생성 (ap-northeast-2 서울 리전)
- `.env`에 Project URL, Anon Key 환경변수 주입
- `npx supabase db push`로 로컬 스키마(`rooms`, `recommendations`) 원격 DB 적용 완료

#### Expo Auth 연동
- `@supabase/supabase-js`, `expo-secure-store` 설치 완료
- `src/services/supabase.ts` 생성 (보안이 높은 `expo-secure-store` 기반의 Session Storage 설정)
- **전역 라우팅 구성 (`app/_layout.tsx`)**: 
  - `supabase.auth.onAuthStateChange` 구독
  - 로그인 상태면 `(main)/home`으로, 비로그인 상태면 `(auth)/login`으로 강제 리다이렉트 분기 처리
- **인증 화면 구현**:
  - `app/(auth)/login.tsx`: 디자인 적용된 이메일/비밀번호 로그인 폼 완성
  - `app/(auth)/signup.tsx`: 회원가입 폼 로직 적용 (비밀번호 확인, 6자 이상 룰 적용)
  - Supabase 대시보드에서 `Confirm Email` 옵션을 꺼서 가입 즉시 로그인/홈으로 이동하도록 로직 간소화 완료

---

## 다음 작업 후보

- [ ] (main) 화면 내비게이션 구성 (Home, Scan, RoomDetail 등 구체화)
- [ ] 홈 화면에 로그아웃 기능 작게 추가 (테스트 편의성)
- [ ] 2D 도면 편집기 (`@shopify/react-native-skia`) UI/로직 기반 구축
- [ ] 네이티브 스캔 모듈 (iOS RoomPlan) Expo 연동 브릿지 작업 시작

---

## 2026-06-29

### Expo SDK 54 patch 경고 안정화
- `expo`, `expo-font`, `expo-linking`, `expo-router`를 Expo가 요구하는 SDK 54 patch 버전으로 정렬
- stale 상태의 `apps/mobile/node_modules`가 루트 pnpm hoisted 의존성을 가려 Expo CLI가 옛 버전을 읽던 문제 확인
- app-local `node_modules`를 `C:\tmp\restructuringhome-mobile-node_modules-stale-20260629-1624`로 백업 이동
- Expo Router의 optional web peer 경고를 줄이기 위해 `react-dom@19.1.0`을 명시

### RoomFloorPlan mock 데이터 연결
- mobile 앱에 `@restructuring-home/domain` workspace 의존성 선언
- `RoomFloorPlan` 타입을 만족하는 원룸 mock fixture 추가
- `room-editor` 화면에 mock 도면 기반 RN View preview 연결
- 벽, 문, 창, 가구, 기본 metric(크기/벽/개구부/가구 수)을 렌더링
