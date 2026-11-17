import { router } from 'expo-router';
import { MainFlowScreen } from '../../src/components/MainFlowScreen';
import { findFurnitureOutsideRoom } from '../../src/features/furniture/model/roomFit';
import { FurnitureEditor } from '../../src/features/furniture/ui/FurnitureEditor';
import { appliedRecommendations } from '../../src/features/recommendations/model/appliedRecommendation';
import { AppliedRecommendationBanner } from '../../src/features/recommendations/ui/AppliedRecommendationBanner';
import { useWorkflowDraft } from '../../src/features/workflow/useWorkflowDraft';
import { getWorkflowRoute } from '../../src/features/workflow/workflowRoute';

export default function FurnitureEditorScreen() {
  const { draftId, plan, updateFurniture } = useWorkflowDraft();
  const undoFurniture = draftId && plan ? appliedRecommendations.getUndo(draftId, plan.furniture) : undefined;

  return (
    <MainFlowScreen
      eyebrow={plan ? 'STEP 2 OF 4' : 'DRAFT EXPIRED'}
      title="가구를 원하는 자리에 놓으세요"
      description={plan ? '가구를 누른 뒤 드래그로 이동하고, 보라색 핸들로 크기·민트 핸들로 회전하세요.' : '초안을 찾지 못했습니다. 홈에서 새 도면을 시작해 주세요.'}
      steps={[
        { label: '가구 추가', description: '카탈로그에서 필요한 가구를 추가합니다.' },
        { label: '직접 배치', description: '위치, 크기, 회전을 조절합니다.' },
      ]}
      primaryLabel={plan ? 'AI 배치 추천받기' : '홈으로'}
      primaryDisabled={Boolean(plan && findFurnitureOutsideRoom(plan).length > 0)}
      onPrimaryPress={() => {
        if (plan && draftId) router.push(getWorkflowRoute('recommendationStyle', draftId));
        else router.replace('/(main)/home');
      }}
      secondaryLabel="도면 설정으로"
      onSecondaryPress={() => router.back()}
    >
      {undoFurniture && draftId ? (
        <AppliedRecommendationBanner onUndo={() => {
          appliedRecommendations.clear(draftId);
          updateFurniture(undoFurniture);
        }} />
      ) : null}
      {plan ? <FurnitureEditor plan={plan} onPlanChange={(next) => updateFurniture(next.furniture)} /> : null}
    </MainFlowScreen>
  );
}
