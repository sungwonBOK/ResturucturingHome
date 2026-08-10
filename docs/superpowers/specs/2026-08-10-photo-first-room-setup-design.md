# 사진 기반 한 페이지 방 설정 설계

## 목표

사용자는 사진 한 장으로 시작해 AI 도면 초안을 받고, 실제 방과 같아질 때까지 방 모양과 가구를 수정한 뒤에만 AI 배치 추천을 요청한다.

이 설계는 native RoomPlan/ARCore를 구현하지 않는다. 사진 입력과 OpenAI Vision 결과는 `RoomFloorPlan` 초안으로 정규화하며, 이후 native 구현도 같은 초안 경계를 교체해 연결할 수 있게 한다.

## 사용자 흐름

한 화면을 아래 순서로 스크롤한다.

1. **사진 선택**: 카메라 촬영 또는 앨범에서 사진 한 장을 선택한다.
2. **AI 도면 초안**: 이미지를 private Storage에 업로드하고, 서버가 Vision 결과를 typed `RoomFloorPlan`으로 바꾼다.
3. **현재 방과 맞추기**: 도면과 가구를 수정하고 `현재 방 상태로 확정`한다.
4. **AI 배치 추천**: 확정 전에는 비활성화한다. 확정한 `RoomFloorPlan`만 기존 `get-recommendations`에 보낸다.

초안 생성 실패, 업로드 실패, 임시 draft 만료는 다음 단계로 넘어가지 않고 현재 단계에서 다시 시도할 수 있게 한다.

## 도면 편집 규칙

`RoomFloorPlan`의 `walls` 배열을 계속 정본으로 쓴다. 별도 polygon 저장 형식은 추가하지 않는다.

### 모드 분리

한 번에 하나의 모드만 활성화한다. 이것이 모바일에서 드래그 동작이 겹치지 않게 하는 핵심이다.

| 모드 | 가능한 동작 | 금지되는 동작 |
| --- | --- | --- |
| 도면 맞추기 (기본) | 꼭짓점 드래그로 위치와 벽 길이 수정 | 꼭짓점 추가·삭제, 가구 수정 |
| 꼭짓점 편집 | 선택한 벽에 꼭짓점 추가, 선택한 꼭짓점 삭제 | 벽 위치 드래그, 가구 수정 |
| 가구 편집 | 가구 선택, 드래그 이동, 크기 조절, 회전 | 벽·꼭짓점 수정 |

꼭짓점을 삭제하면 앞뒤 벽을 하나의 새 벽으로 연결한다. 최소 세 꼭짓점은 항상 남긴다. 문·창문이 걸린 벽은 실수로 삭제하지 못하게 이유를 안내한다. 꼭짓점 이동 시 문·창문은 해당 벽 위의 상대 위치를 유지한다.

가구 편집은 캔버스 조작과 간단한 수치 입력을 함께 제공한다. 캔버스에서는 본체 드래그로 이동, 모서리 손잡이로 크기 조절, 회전 손잡이로 회전한다. 수치 입력은 정밀 보정과 접근성 보조 수단이다.

## 데이터와 서버 경계

```text
카메라/앨범 사진
  -> image picker adapter
  -> private Supabase Storage
  -> generate-floor-plan Edge Function
  -> OpenAI Vision
  -> RoomFloorPlan 초안
  -> ScanDraftRepository (draftId)
  -> 한 페이지 room setup editor
  -> 확정 RoomFloorPlan
  -> 기존 get-recommendations
```

- 모바일 앱에는 OpenAI 키를 두지 않는다.
- `generate-floor-plan`은 새 Edge Function으로 둔다. 기존 추천 Function과 합치지 않는다.
- Edge Function은 업로드된 이미지를 짧게 유효한 signed URL로 읽고, OpenAI 응답을 검증한 뒤 `RoomFloorPlan`만 반환한다.
- 첫 출시 범위는 사진 한 장이다. 여러 장 병합, AR/RoomPlan, 자동 영구 저장은 후속 범위다.
- `ScanDraftRepository`는 현재처럼 `draftId` 기반의 임시 전달 경계로 유지하되, 편집할 때마다 최신 `RoomFloorPlan`을 갱신할 수 있게 확장한다.

## 책임 분리

- `features/photo-input/`: 카메라·앨범 권한과 사진 선택만 담당한다.
- `features/floor-plan-draft/`: Storage 업로드, Function 호출, AI 초안 계약 검증만 담당한다.
- `features/room-editor/geometry/`: 꼭짓점 추가·삭제·이동과 문·창문 재배치를 하는 순수 함수만 둔다.
- `features/room-editor/`: 모드 전환, 선택 상태, 캔버스 제스처와 폼을 조합한다.
- `features/recommendations/`: 확정된 plan으로 추천을 요청하고 결과를 보여주는 역할만 유지한다.

기존 `FloorPlanPreview`는 읽기 전용으로 유지한다. 편집 터치와 상태를 억지로 섞지 않고, 새 `EditableFloorPlanCanvas`가 편집만 담당한다.

## 검증

자동 검증은 화면 전체보다 순수 계약과 도형 규칙을 우선한다.

1. Vision 응답 계약: 누락·잘못된 구조·잘못된 좌표를 거부하고 유효한 `RoomFloorPlan`만 허용한다.
2. 도형 함수: 꼭짓점 이동, 벽 선택 후 추가, 안전한 삭제, 문·창문이 있는 벽의 삭제 차단을 검증한다.
3. 가구 함수: 이동·크기·회전이 `RoomFloorPlan` 범위와 회전 규칙을 지키는지 검증한다.
4. TypeScript 및 Edge Function type-check를 실행한다.

수동 Expo Go 검증은 별도로 한다: 카메라 권한, 앨범 선택, 이미지 업로드, AI 초안 생성, 사각형·L자·꺾인 방 수정, 가구 제스처, 확정 뒤 추천 카드 3개 표시.

## 범위 밖

- native RoomPlan/ARCore 모듈
- 여러 사진 합성
- 3D 결과 반영
- 추천 결과의 자동 저장 또는 적용
- CAD 수준의 각도·치수 고정 도구
