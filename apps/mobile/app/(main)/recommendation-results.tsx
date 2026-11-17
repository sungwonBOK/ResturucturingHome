import { router, useLocalSearchParams } from 'expo-router';
import { MainFlowScreen } from '../../src/components/MainFlowScreen';
import { appliedRecommendations } from '../../src/features/recommendations/model/appliedRecommendation';
import { recommendationSession } from '../../src/features/recommendations/model/recommendationSession';
import { RecommendationResults } from '../../src/features/recommendations/ui/RecommendationResults';
import { scanDraftRepository } from '../../src/features/scan/scanDraftStore';
import { getWorkflowRoute } from '../../src/features/workflow/workflowRoute';

export default function RecommendationResultsScreen() {
  const { draftId } = useLocalSearchParams<{ draftId?: string | string[] }>();
  const selectedDraftId = typeof draftId === 'string' ? draftId : undefined;
  const currentPlan = selectedDraftId ? scanDraftRepository.get(selectedDraftId) : undefined;
  const entry = selectedDraftId ? recommendationSession.get(selectedDraftId) : undefined;
  const isReady = Boolean(entry?.recommendation && entry.plan === currentPlan);

  const applyRecommendation = () => {
    // 추천을 요청한 도면이 그대로일 때만 적용합니다(isReady). 적용 전 배치는 되돌리기용으로 남깁니다.
    if (!selectedDraftId || !currentPlan || !entry?.recommendation || entry.plan !== currentPlan) return;
    const updated = scanDraftRepository.updateFurniture(selectedDraftId, entry.recommendation.furniture);
    if (!updated) return;
    appliedRecommendations.record(selectedDraftId, currentPlan.furniture, updated.furniture);
    router.dismissTo(getWorkflowRoute('furnitureEditor', selectedDraftId));
  };

  return (
    <MainFlowScreen
      eyebrow={isReady ? 'STEP 4 OF 4' : 'RECOMMENDATION UNAVAILABLE'}
      title={isReady ? '배치 결과를 확인하세요' : '추천 결과를 찾지 못했습니다'}
      description={isReady ? '선택한 종류의 배치도 하나만 보여드립니다. 적용하기 전까지 내 도면은 그대로예요.' : '배치 종류를 선택해 추천을 다시 요청해 주세요.'}
      steps={[{ label: '추천 도면 확인', description: '선택한 종류의 대표 배치를 봅니다.' }]}
      primaryLabel={!currentPlan ? '홈으로' : isReady ? '다른 종류 고르기' : '배치 종류 선택으로'}
      onPrimaryPress={() => {
        if (currentPlan && selectedDraftId) router.dismissTo(getWorkflowRoute('recommendationStyle', selectedDraftId));
        else router.replace('/(main)/home');
      }}
      secondaryLabel={currentPlan ? '가구 배치로 돌아가기' : undefined}
      onSecondaryPress={() => {
        if (selectedDraftId) router.dismissTo(getWorkflowRoute('furnitureEditor', selectedDraftId));
        else router.back();
      }}
    >
      {isReady && entry ? <RecommendationResults entry={entry} onApply={applyRecommendation} /> : null}
    </MainFlowScreen>
  );
}
