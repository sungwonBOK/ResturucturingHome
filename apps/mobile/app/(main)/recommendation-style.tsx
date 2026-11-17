import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import type { RoomStyle } from '@restructuring-home/domain';
import { useCallback, useRef, useState } from 'react';
import { MainFlowScreen } from '../../src/components/MainFlowScreen';
import { recommendationSession } from '../../src/features/recommendations/model/recommendationSession';
import { recommendationService } from '../../src/features/recommendations/recommendationApi';
import { RecommendationStyleSelection } from '../../src/features/recommendations/ui/RecommendationStyleSelection';
import { scanDraftRepository } from '../../src/features/scan/scanDraftStore';
import { getWorkflowRoute } from '../../src/features/workflow/workflowRoute';

export default function RecommendationStyleScreen() {
  const { draftId } = useLocalSearchParams<{ draftId?: string | string[] }>();
  const selectedDraftId = typeof draftId === 'string' ? draftId : undefined;
  const isExpired = !selectedDraftId || !scanDraftRepository.get(selectedDraftId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRequest = useRef<{ draftId: string; version: number } | null>(null);

  useFocusEffect(useCallback(() => {
    setIsLoading(false);
    setError(null);
    return () => { pendingRequest.current = null; };
  }, [selectedDraftId]));

  const handleRequest = async (style: RoomStyle) => {
    if (!selectedDraftId || pendingRequest.current !== null) return;
    const plan = scanDraftRepository.get(selectedDraftId);
    if (!plan) return;

    const request = { draftId: selectedDraftId, version: recommendationSession.begin(selectedDraftId, plan, style) };
    pendingRequest.current = request;
    setIsLoading(true);
    setError(null);

    try {
      const recommendations = await recommendationService.request({ floorPlan: plan, style });
      const currentPlan = scanDraftRepository.get(selectedDraftId);
      if (pendingRequest.current === request &&
          recommendationSession.complete(request.draftId, request.version, recommendations, currentPlan)) {
        router.push(getWorkflowRoute('recommendationResults', selectedDraftId));
      }
    } catch (requestError) {
      if (pendingRequest.current === request && scanDraftRepository.get(selectedDraftId) === plan) {
        setError(requestError instanceof Error ? requestError.message : 'AI 추천을 불러오지 못했습니다.');
      }
    } finally {
      if (pendingRequest.current === request) {
        pendingRequest.current = null;
        setIsLoading(false);
      }
    }
  };

  const leaveStyleSelection = () => {
    pendingRequest.current = null;
    if (isExpired) router.replace('/(main)/home');
    else router.back();
  };

  return (
    <MainFlowScreen
      eyebrow={isExpired ? 'DRAFT EXPIRED' : 'STEP 3 OF 4'}
      title="원하는 배치 방향을 고르세요"
      description={isExpired ? '초안을 찾지 못했습니다. 홈에서 새 도면을 시작해 주세요.' : '지금 있는 가구로 원하는 배치도를 만들어요.'}
      steps={[]}
      primaryLabel={isExpired ? '홈으로' : '가구 배치로'}
      onPrimaryPress={leaveStyleSelection}
      secondaryLabel="이전으로"
      onSecondaryPress={leaveStyleSelection}
    >
      {!isExpired ? <RecommendationStyleSelection isLoading={isLoading} error={error} onRequest={handleRequest} /> : null}
    </MainFlowScreen>
  );
}
