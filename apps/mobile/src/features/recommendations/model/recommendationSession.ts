import type { RecommendationLayout, RoomFloorPlan, RoomStyle } from '@restructuring-home/domain';

export interface RecommendationSessionEntry {
  plan: RoomFloorPlan;
  style: RoomStyle;
  recommendation?: RecommendationLayout;
  requestVersion: number;
}

export interface RecommendationSession {
  begin(draftId: string, plan: RoomFloorPlan, style: RoomStyle): number;
  complete(draftId: string, requestVersion: number, recommendations: RecommendationLayout[], currentPlan: RoomFloorPlan | undefined): boolean;
  get(draftId: string): RecommendationSessionEntry | undefined;
}

export function createRecommendationSession(): RecommendationSession {
  const entries = new Map<string, RecommendationSessionEntry>();

  return {
    begin(draftId, plan, style) {
      const requestVersion = (entries.get(draftId)?.requestVersion ?? 0) + 1;
      entries.set(draftId, { plan, style, requestVersion });
      return requestVersion;
    },
    complete(draftId, requestVersion, recommendations, currentPlan) {
      const entry = entries.get(draftId);

      if (!entry || entry.requestVersion !== requestVersion || entry.plan !== currentPlan) {
        return false;
      }

      entries.set(draftId, { ...entry, recommendation: recommendations[0] });
      return true;
    },
    get(draftId) {
      return entries.get(draftId);
    },
  };
}

export const recommendationSession = createRecommendationSession();
