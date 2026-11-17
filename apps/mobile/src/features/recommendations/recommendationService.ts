import type {
  RecommendationLayout,
  FurnitureItem,
  FurnitureUse,
  RoomFloorPlan,
  RoomStyle,
} from '@restructuring-home/domain';
import { getFurnitureUse } from '../furniture/catalog/getFurnitureCatalogItem';
import { findFurnitureOutsideRoom } from '../furniture/model/roomFit';
import { getRoomInterior } from '../room-plan/model/roomInterior';
import { validateRoomOutline, type OutlinePoint } from '../room-plan/model/roomOutline';
import { validateRecommendationPlacements } from './model/validateRecommendationPlacement';

export interface RecommendationFunctionClient {
  invoke: (
    name: 'get-recommendations',
    options: { body: {
      floorPlan: Omit<RoomFloorPlan, 'furniture'> & { furniture: Array<FurnitureItem & { use: FurnitureUse }> };
      style: RoomStyle;
      /** 벽 안쪽 면으로 둘러싸인 실제 바닥. AI가 벽 두께를 직접 계산하지 않게 합니다. */
      roomInterior: OutlinePoint[];
      screenshotUrl?: string;
      contractVersion: 2;
    } },
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
      const outline = validateRoomOutline(input.floorPlan);
      if (!outline.isValid) {
        throw new Error(outline.message);
      }
      if (!input.floorPlan.furniture.length) {
        throw new Error('추천받을 가구를 하나 이상 추가해 주세요.');
      }
      if (input.floorPlan.furniture.some((item) => !Number.isFinite(item.width) || !Number.isFinite(item.height) ||
          item.width <= 0 || item.height <= 0)) {
        throw new Error('배치를 추천받기 전에 가구 치수를 확인해 주세요.');
      }
      if (new Set(input.floorPlan.furniture.map(({ id }) => id)).size !== input.floorPlan.furniture.length ||
          input.floorPlan.furniture.some(({ x, y, rotation }) => ![x, y, rotation].every(Number.isFinite))) {
        throw new Error('추천을 요청하기 전에 가구 위치와 식별 정보를 확인해 주세요.');
      }
      const outside = findFurnitureOutsideRoom(input.floorPlan);
      if (outside.length) {
        throw new Error(`방 밖에 있는 가구를 방 안으로 옮겨 주세요: ${outside.map((item) => item.label ?? item.id).join(', ')}`);
      }

      const result = await client.invoke('get-recommendations', { body: {
        ...input,
        contractVersion: 2,
        roomInterior: getRoomInterior(input.floorPlan),
        floorPlan: {
          ...input.floorPlan,
          furniture: input.floorPlan.furniture.map((item) => ({ ...item, use: getFurnitureUse(item) })),
        },
      } });

      if (result.error) {
        throw new Error('AI 추천을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }

      const recommendations = parseRecommendationResponse(result.data, input.style);
      const valid = validateRecommendationPlacements(recommendations, input.floorPlan, input.style);
      if (!valid.length) {
        throw new Error('벽, 출입구, 가구 사용 공간을 확보할 배치를 찾지 못했어요. 도면이나 가구 치수를 확인해 주세요.');
      }
      return valid;
    },
  };
}

function parseRecommendationResponse(value: unknown, selectedStyle: RoomStyle): RecommendationLayout[] {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { recommendations?: unknown }).recommendations)) {
    throw new Error('추천 응답 형식이 올바르지 않습니다.');
  }

  const recommendations = (value as { recommendations: unknown[] }).recommendations;

  if (recommendations.length > 3) {
    throw new Error('추천 응답 형식이 올바르지 않습니다.');
  }

  return recommendations.filter((layout): layout is RecommendationLayout => isRecommendationLayout(layout, selectedStyle));
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
