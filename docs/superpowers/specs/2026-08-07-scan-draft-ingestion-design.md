# 스캔 도면 초안 수집 설계

## 목표

native iOS RoomPlan과 Android ARCore를 아직 도입하지 않고, 임의의 스캔 원본 결과가 공유 `RoomFloorPlan` 초안으로 정규화되어 `scan -> room-editor` 흐름으로 전달되게 한다.

## 범위

- `RoomFloorPlan`은 계속 `packages/domain/src/index.ts`를 단일 원천으로 사용한다.
- 스캔 원본을 `RoomFloorPlan`으로 바꾸는 adapter 경계를 만든다.
- 정규화된 초안은 임시 저장소에 보관하고, 화면 전환에는 `draftId`만 사용한다.
- editor는 `draftId`가 있을 때 저장소에서 찾은 `RoomFloorPlan`을 preview와 persistence panel에 전달한다.
- 기존 Home 등에서 editor를 직접 여는 흐름은 `mockStudioFloorPlan`을 fallback으로 유지한다.

## 비범위

- iOS RoomPlan, Android ARCore, Expo native module, prebuild 설정을 추가하지 않는다.
- 스캔 초안의 앱 재시작 후 복구나 서버 동기화를 구현하지 않는다.
- floor-plan 편집 기능 및 Supabase room 저장 정책을 변경하지 않는다.

## 선택한 전달 방식

### 선택: 임시 ScanDraftRepository + draftId 라우팅

`ScanDraftRepository`는 typed `RoomFloorPlan`을 `draftId`로 생성하고 조회한다. scan 화면은 fixture 기반 adapter가 반환한 plan을 저장한 뒤 `/room-editor?draftId=<id>`로 이동한다. editor는 route parameter를 식별자로만 사용하고 repository에서 `RoomFloorPlan`을 조회한다.

```text
scan fixture/raw result
  -> ScanResultAdapter<T>
  -> RoomFloorPlan
  -> ScanDraftRepository.create(plan)
  -> draftId
  -> room-editor
  -> ScanDraftRepository.get(draftId)
  -> FloorPlanPreview / RoomPersistencePanel
```

이 방식은 도면을 URL 문자열로 직렬화하지 않아 복잡한 스캔 데이터와 타입 안정성을 보존한다. 정식 native adapter는 같은 `ScanResultAdapter<T>` 경계 뒤에서 현재 fixture adapter를 대체한다. 저장소 구현은 현재 메모리 기반으로 시작하되, 호출부 변경 없이 영속 저장소로 교체할 수 있다.

### 기각: RoomFloorPlan JSON 라우트 파라미터

`RoomFloorPlan` 전체를 JSON으로 직렬화해 route parameter로 넘기는 방식은 단순하지만, 파싱과 런타임 검증이 필요하고 URL 길이 및 deep link 제약을 받는다. RoomPlan/ARCore 원본 메타데이터가 커질 정식 출시 경로에는 적합하지 않다.

## 구성 요소와 책임

- `ScanResultAdapter<T>`: 특정 원본 결과 `T`를 `RoomFloorPlan`으로 정규화한다. platform SDK 의존성은 이 경계 안에만 둔다.
- fixture adapter: native module 없이 scan 흐름을 재현하는 테스트용 raw 결과를 변환한다.
- `ScanDraftRepository`: 현재 navigation session의 draft 생성·조회만 책임진다. 없거나 만료된 ID는 명시적으로 `undefined`를 반환한다.
- scan route: fixture 결과를 수집·정규화·저장하고 `draftId`를 포함해 이동한다.
- room-editor route: draft를 조회해 typed plan을 child component에 전달한다. draft가 없거나 조회에 실패하면 기존 mock plan을 사용한다.

## 오류 및 수명 정책

- `draftId`가 없으면 editor는 기존 mock fallback을 사용한다.
- `draftId`가 있지만 저장소에 없으면 editor는 fallback을 사용하며, 앱이 재시작되었거나 임시 draft가 사라졌음을 사용자에게 짧게 알린다.
- 메모리 저장소의 수명은 앱 프로세스와 같다. 재시작 복구는 이 Issue의 비범위다.
- raw 결과가 typed plan으로 변환되지 못하면 scan은 editor로 이동하지 않고 오류를 표시한다.

## TDD와 검증

다음 순서를 각 행동 단위에 적용한다.

1. adapter가 fixture raw 결과를 예상 `RoomFloorPlan`으로 바꾸는 실패 테스트를 작성하고, feature 부재로 실패한 로그를 확인한다.
2. repository의 create/get과 존재하지 않는 ID 동작을 실패 테스트로 증명한다.
3. 최소 구현 후 해당 테스트의 green 로그를 확인한다.
4. scan route가 `draftId`만 포함해 이동하고, editor가 typed draft를 우선 사용한다는 순수 helper 또는 화면 경계 테스트를 추가한다.
5. domain type-check와 mobile TypeScript 검사를 실행한다. Expo Go 수동 확인은 자동 검증과 별도로 보고한다.

## 완료 조건

- fixture scan 결과가 `RoomFloorPlan`으로 정규화된다.
- scan 완료 뒤 `draftId`를 가진 editor 경로로 이동한다.
- editor preview와 저장 패널이 mock 대신 해당 typed draft를 받는다.
- native adapter가 같은 adapter 경계를 구현할 수 있다.
- 구현 전후 RED/GREEN 로그와 TypeScript 검사 결과가 남는다.
