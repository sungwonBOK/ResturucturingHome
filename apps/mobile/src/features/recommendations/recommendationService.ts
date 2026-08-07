import type {
  RecommendationLayout,
  RoomFloorPlan,
  RoomStyle,
} from '@restructuring-home/domain';

export interface RecommendationFunctionClient {
  invoke: (
    name: 'get-recommendations',
    options: { body: { floorPlan: RoomFloorPlan; style: RoomStyle; screenshotUrl?: string } },
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
}

export interface RecommendationService {
  request(input: {
    floorPlan: RoomFloorPlan;
    style: RoomStyle;
    screenshotUrl?: string;
  }): Promise<RecommendationLayout[]>;
}

export function createRecommendationService(client: RecommendationFunctionClient): RecommendationService {
  return {
    async request(input) {
      const result = await client.invoke('get-recommendations', { body: input });

      if (result.error) {
        throw new Error('AI 추천을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }

      return parseRecommendationResponse(result.data, input.style);
    },
  };
}

function parseRecommendationResponse(value: unknown, selectedStyle: RoomStyle): RecommendationLayout[] {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { recommendations?: unknown }).recommendations)) {
    throw new Error('추천 응답 형식이 올바르지 않습니다.');
  }

  const recommendations = (value as { recommendations: unknown[] }).recommendations;

  if (recommendations.length !== 3 || !recommendations.every((layout) => isRecommendationLayout(layout, selectedStyle))) {
    throw new Error('추천 응답 형식이 올바르지 않습니다.');
  }

  return recommendations as RecommendationLayout[];
}

function isRecommendationLayout(value: unknown, selectedStyle: RoomStyle): value is RecommendationLayout {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const layout = value as Partial<RecommendationLayout>;

  return (
    typeof layout.id === 'string' &&
    layout.style === selectedStyle &&
    typeof layout.reason === 'string' &&
    Array.isArray(layout.furniture)
  );
}
