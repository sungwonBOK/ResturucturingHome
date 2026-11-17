import { router } from 'expo-router';
import { MainFlowScreen } from '../../src/components/MainFlowScreen';
import { RoomPlanSetupEditor } from '../../src/features/room-plan/ui/RoomPlanSetupEditor';
import { validateRoomOutline } from '../../src/features/room-plan/model/roomOutline';
import { useWorkflowDraft } from '../../src/features/workflow/useWorkflowDraft';
import { getWorkflowRoute } from '../../src/features/workflow/workflowRoute';

export default function RoomPlanSetupScreen() {
  const { draftId, plan, updateOutline } = useWorkflowDraft();

  return (
    <MainFlowScreen
      eyebrow={plan ? 'STEP 1 OF 4' : 'DRAFT EXPIRED'}
      title="방 도면을 먼저 완성하세요"
      description={plan ? '방 크기와 꼭짓점, 문·창 위치를 조절한 뒤 가구를 추가할 차례입니다.' : '편집 중이던 초안을 찾지 못했습니다. 홈에서 새 도면을 시작해 주세요.'}
      steps={[
        { label: '방 크기 조절', description: '가로와 세로를 cm 단위로 수정합니다.' },
        { label: '방 모양 조절', description: '꼭짓점을 끌어 자유 형태 도면을 만듭니다.' },
        { label: '문·창 배치', description: '벽을 눌러 문과 창을 추가하고 벽을 따라 옮깁니다.' },
      ]}
      primaryLabel={plan ? '가구 추가하기' : '홈으로'}
      primaryDisabled={Boolean(plan && !validateRoomOutline(plan).isValid)}
      onPrimaryPress={() => {
        if (plan && draftId) router.push(getWorkflowRoute('furnitureEditor', draftId));
        else router.replace('/(main)/home');
      }}
      secondaryLabel="이전으로"
      onSecondaryPress={() => router.back()}
    >
      {plan ? <RoomPlanSetupEditor plan={plan} onPlanChange={updateOutline} /> : null}
    </MainFlowScreen>
  );
}
