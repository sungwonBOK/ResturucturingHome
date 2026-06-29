import { router } from 'expo-router';
import { MainFlowScreen } from '../../src/components/MainFlowScreen';

export default function ScanScreen() {
  return (
    <MainFlowScreen
      eyebrow="SCAN"
      title="방 구조를 먼저 잡아볼게요"
      description="지금은 스캔 플로우의 화면 뼈대입니다. 이후 iOS RoomPlan, Android ARCore, 사진 기반 수동 입력을 이 화면에 연결합니다."
      steps={[
        { label: '방 스캔 시작', description: '기기별 스캔 모듈을 호출해 벽과 개구부 초안을 만듭니다.' },
        { label: '초안 확인', description: '스캔 결과를 공통 RoomFloorPlan 타입으로 변환합니다.' },
        { label: '도면 수정', description: '사용자가 벽과 가구 위치를 보정할 수 있게 편집기로 넘깁니다.' },
      ]}
      primaryLabel="도면 편집으로 이동"
      onPrimaryPress={() => router.push('/(main)/room-editor')}
      secondaryLabel="홈으로 돌아가기"
      onSecondaryPress={() => router.back()}
    />
  );
}
