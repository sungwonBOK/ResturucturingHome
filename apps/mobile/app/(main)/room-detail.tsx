import { router } from 'expo-router';
import { MainFlowScreen } from '../../src/components/MainFlowScreen';

export default function RoomDetailScreen() {
  return (
    <MainFlowScreen
      eyebrow="ROOM DETAIL"
      title="추천 전 마지막 확인 화면입니다"
      description="방 이름, 도면 요약, 선택 스타일, AI 추천 결과가 모일 상세 화면입니다. Supabase rooms/recommendations 데이터와 연결될 자리입니다."
      steps={[
        { label: '방 정보 저장', description: 'RoomFloorPlan과 스캔 이미지를 rooms 테이블에 저장합니다.' },
        { label: '스타일 선택', description: 'minimal, nordic, modern, vintage 중 추천 기준을 고릅니다.' },
        { label: '추천 요청', description: 'Edge Function으로 도면과 스타일을 보내 3가지 배치를 받습니다.' },
      ]}
      primaryLabel="편집 화면으로 돌아가기"
      onPrimaryPress={() => router.push('/(main)/room-editor')}
      secondaryLabel="홈으로 이동"
      onSecondaryPress={() => router.push('/(main)/home')}
    />
  );
}
