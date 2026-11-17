import type { RoomFloorPlan } from '@restructuring-home/domain';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { scanDraftRepository } from '../scan/scanDraftStore';

// 작업 단계 화면들이 공통으로 쓰는 초안 상태. 초안을 못 찾으면 plan이 undefined입니다(예시 도면으로 대체하지 않음).
export function useWorkflowDraft() {
  const params = useLocalSearchParams<{ draftId?: string | string[] }>();
  const draftId = typeof params.draftId === 'string' ? params.draftId : undefined;
  const [plan, setPlan] = useState(() => (draftId ? scanDraftRepository.get(draftId) : undefined));

  useFocusEffect(useCallback(() => {
    setPlan(draftId ? scanDraftRepository.get(draftId) : undefined);
  }, [draftId]));

  const updateOutline = useCallback((next: RoomFloorPlan) => {
    const updated = draftId ? scanDraftRepository.updateOutline(draftId, next) : undefined;
    if (updated) setPlan(updated);
  }, [draftId]);

  const updateFurniture = useCallback((furniture: RoomFloorPlan['furniture']) => {
    const updated = draftId ? scanDraftRepository.updateFurniture(draftId, furniture) : undefined;
    if (updated) setPlan(updated);
  }, [draftId]);

  return { draftId, plan, updateOutline, updateFurniture };
}
