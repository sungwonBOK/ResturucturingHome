# DOMAIN.md — 도메인 로직 설명

## Room JSON 스키마

`packages/domain/src/index.ts`에 정의된 공통 타입입니다.
iOS(RoomPlan) / Android(ARCore) 스캔 결과를 모두 이 형식으로 변환합니다.

### 좌표계
- 단위: cm
- 원점(0,0): 방의 좌상단
- x축: 오른쪽, y축: 아래쪽

### 가구 회전
- `rotation`: 시계 방향 각도 (0~359도)
- 기준점: 가구 중심

## 스캔 전략
- **iOS LiDAR 기기**: RoomPlan API → 자동 도면 생성
- **일반 기기**: 카메라 촬영 → 수동 편집
- 두 경로 모두 동일한 `RoomFloorPlan` 스키마로 합류

## AI 추천
- OpenAI GPT-4o Vision API 사용
- Supabase Edge Function 경유로 API 키 보호
- 입력: 도면 스크린샷 + 선택 스타일
- 출력: 3가지 배치 (`RecommendationLayout[]`)
