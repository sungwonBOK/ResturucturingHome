import { router } from 'expo-router';
import { MainFlowScreen } from '../../src/components/MainFlowScreen';
import { FloorPlanPreview } from '../../src/features/room-editor/FloorPlanPreview';
import { mockStudioFloorPlan } from '../../src/mocks/mockRoomFloorPlan';

export default function RoomEditorScreen() {
  return (
    <MainFlowScreen
      eyebrow="FLOOR PLAN"
      title="2D 도면을 다듬는 자리입니다"
      description="Skia 기반 편집기가 들어올 화면입니다. 지금은 방 외곽, 가구 배치, 수정 액션이 들어갈 영역을 먼저 고정합니다."
      steps={[
        { label: '방 외곽 확인', description: '스캔 또는 사진 기반으로 생성된 벽 좌표를 보여줍니다.' },
        { label: '가구 위치 수정', description: '가구의 크기, 위치, 회전값을 RoomFloorPlan에 반영합니다.' },
        { label: 'AI 추천 준비', description: '수정된 도면과 선택 스타일을 추천 요청 입력으로 사용합니다.' },
      ]}
      primaryLabel="방 상세로 이동"
      onPrimaryPress={() => router.push('/(main)/room-detail')}
      secondaryLabel="스캔 화면으로 돌아가기"
      onSecondaryPress={() => router.back()}
    >
      <FloorPlanPreview plan={mockStudioFloorPlan} />
    </MainFlowScreen>
  );
}
