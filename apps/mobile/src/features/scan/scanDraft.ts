import type { RoomFloorPlan } from '@restructuring-home/domain';
import { mockStudioFloorPlan } from '../../mocks/mockRoomFloorPlan';

export interface ScanResultAdapter<RawResult> {
  toRoomFloorPlan(rawResult: RawResult): RoomFloorPlan;
}

export interface ScanDraft {
  id: string;
  plan: RoomFloorPlan;
}

export interface ScanDraftRepository {
  create(plan: RoomFloorPlan): ScanDraft;
  get(draftId: string): RoomFloorPlan | undefined;
}

export interface FixtureScanResult {
  dimensions: {
    widthCm: number;
    heightCm: number;
  };
  boundaries: RoomFloorPlan['walls'];
  entries: RoomFloorPlan['doors'];
  glazedOpenings: RoomFloorPlan['windows'];
  detectedFurniture: RoomFloorPlan['furniture'];
}

export const fixtureScanResult: FixtureScanResult = {
  dimensions: {
    widthCm: mockStudioFloorPlan.width,
    heightCm: mockStudioFloorPlan.height,
  },
  boundaries: mockStudioFloorPlan.walls,
  entries: mockStudioFloorPlan.doors,
  glazedOpenings: mockStudioFloorPlan.windows,
  detectedFurniture: mockStudioFloorPlan.furniture,
};

export const fixtureScanResultAdapter: ScanResultAdapter<FixtureScanResult> = {
  toRoomFloorPlan(rawResult) {
    return {
      width: rawResult.dimensions.widthCm,
      height: rawResult.dimensions.heightCm,
      walls: rawResult.boundaries,
      doors: rawResult.entries,
      windows: rawResult.glazedOpenings,
      furniture: rawResult.detectedFurniture,
    };
  },
};

export function createMemoryScanDraftRepository(): ScanDraftRepository {
  const drafts = new Map<string, RoomFloorPlan>();
  let nextDraftNumber = 1;

  return {
    create(plan) {
      const id = `scan-draft-${nextDraftNumber}`;

      nextDraftNumber += 1;
      drafts.set(id, plan);

      return { id, plan };
    },

    get(draftId) {
      return drafts.get(draftId);
    },
  };
}

export const scanDraftRepository = createMemoryScanDraftRepository();

export function getRoomEditorPlan(
  draftId: string | undefined,
  repository: ScanDraftRepository,
  fallbackPlan: RoomFloorPlan,
): RoomFloorPlan {
  return (draftId ? repository.get(draftId) : undefined) ?? fallbackPlan;
}
