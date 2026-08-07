# Issue #6 AI 추천 미리보기 설계

## 목표

로그인한 사용자가 현재 `RoomFloorPlan`과 선택한 스타일을 보내면, Supabase Edge Function이 OpenAI를 호출해 3개의 `RecommendationLayout`을 반환하고 room-editor에서 미리 보여준다.

## 범위와 비범위

- 범위: 요청 검증, OpenAI 서버 호출, 구조화된 추천 응답 검증, 모바일 호출과 미리보기 UI.
- 범위: `minimal`, `nordic`, `modern`, `vintage` 중 한 스타일 선택과 선택된 스타일 기준의 추천 3개.
- 범위: 선택적으로 HTTPS screenshot URL을 입력으로 받을 수 있는 API 경계. 이번 모바일 UI에는 screenshot 선택기를 추가하지 않는다.
- 비범위: 추천 자동 저장, `recommendations` 테이블 쓰기, roomId 연결, native scan, 이미지 업로드, 3D 렌더링.

## 선택한 구조

```text
room-editor
  -> RecommendationPanel
  -> recommendationService
  -> supabase.functions.invoke('get-recommendations')
  -> Edge Function index
  -> contracts (입력과 출력 검증)
  -> openai client (서버 secret만 사용)
  -> RecommendationLayout[]
  -> RecommendationPanel 미리보기
```

### Edge Function 파일 책임

- `contracts.ts`: 요청 JSON을 `RecommendationRequest`로 검증하고, OpenAI JSON을 domain-compatible `RecommendationLayout[]`으로 정규화한다.
- `openai.ts`: OpenAI Responses API를 호출하고 구조화된 JSON 텍스트만 돌려준다. API key와 HTTP 의존성은 주입받는다.
- `index.ts`: HTTP/CORS/JSON 오류를 처리하고 contracts와 OpenAI client를 조합한다. 데이터 규칙이나 prompt 상세를 갖지 않는다.

### 모바일 파일 책임

- `recommendationService.ts`: Supabase Function client 호출과 응답 형태 검증만 담당한다.
- `RecommendationPanel.tsx`: 스타일 선택, 호출 상태, 오류, 추천 카드 렌더링만 담당한다.
- `room-editor.tsx`: 이미 선택한 typed `RoomFloorPlan`을 panel에 전달하기만 한다.

## API 계약

### 요청

```ts
{
  floorPlan: RoomFloorPlan,
  style: 'minimal' | 'nordic' | 'modern' | 'vintage',
  screenshotUrl?: string
}
```

`floorPlan`, `style`은 필수다. `screenshotUrl`은 있을 때만 HTTPS URL이어야 한다.

### 응답

```ts
{
  recommendations: RecommendationLayout[]
}
```

Function은 정확히 3개를 요구하며, 모든 가구의 type·위치·크기·회전값을 검증한다. 저장은 하지 않는다.

## 보안과 오류

- `OPENAI_API_KEY`는 Supabase Function secret으로만 읽는다. Expo 환경 변수나 모바일 코드에 넣지 않는다.
- 배포 시 `verify_jwt=true`를 유지한다. 모바일 `supabase.functions.invoke`는 로그인 세션을 이용한다.
- 요청 오류는 400, 미설정 secret은 500, OpenAI 호출/출력 오류는 502로 분리한다. 사용자에게는 안전한 한국어 오류 메시지만 표시한다.
- screenshot URL은 OpenAI에 전달되는 선택 입력이다. 이번 범위에서 Storage private URL을 생성하거나 업로드하지 않는다.

## 검증

1. contracts unit test: 필수 입력 누락, 유효 입력, 잘못된 모델 출력, 정확히 3개인 유효 응답.
2. OpenAI client unit test: 서버 key로 request를 만들고, image URL이 있을 때만 image input을 넣는다.
3. mobile service unit test: Function response를 `RecommendationLayout[]`으로 반환하고 오류를 전달한다.
4. mobile TypeScript·domain type-check와 Function의 Deno type-check를 실행한다.
5. 배포와 실제 OpenAI 호출은 `OPENAI_API_KEY` secret 설정 후 별도 수동 게이트로 확인한다.
