import type { FurnitureItem } from '@restructuring-home/domain';

export interface AppliedRecommendations {
  record(draftId: string, previous: FurnitureItem[], applied: FurnitureItem[]): void;
  /** 적용 직후 상태 그대로일 때만 되돌릴 배치를 돌려줍니다. 그 뒤에 직접 고쳤다면 고친 내용을 지키기 위해 되돌리지 않습니다. */
  getUndo(draftId: string, currentFurniture: FurnitureItem[]): FurnitureItem[] | undefined;
  clear(draftId: string): void;
}

export function createAppliedRecommendations(): AppliedRecommendations {
  const entries = new Map<string, { previous: FurnitureItem[]; applied: FurnitureItem[] }>();

  return {
    record(draftId, previous, applied) {
      entries.set(draftId, { previous, applied });
    },
    getUndo(draftId, currentFurniture) {
      const entry = entries.get(draftId);
      return entry && entry.applied === currentFurniture ? entry.previous : undefined;
    },
    clear(draftId) {
      entries.delete(draftId);
    },
  };
}

export const appliedRecommendations = createAppliedRecommendations();
