import type { RoomFloorPlan } from '@restructuring-home/domain';
import { parseStoredDraft, serializeDraft } from './draftStorageFormat';

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
  /** 가장 최근에 만들거나 수정한 초안. 홈의 "이어서 편집하기"에 씁니다. */
  getLatestDraftId(): string | undefined;
  updateOutline(draftId: string, outline: Omit<RoomFloorPlan, 'furniture'>): RoomFloorPlan | undefined;
  updateFurniture(draftId: string, furniture: RoomFloorPlan['furniture']): RoomFloorPlan | undefined;
  /** 기기에 저장된 마지막 초안을 불러옵니다. 실패해도 예외 없이 빈 상태로 시작합니다. */
  hydrate(): Promise<void>;
  /** 대기 중인 저장을 즉시 실행합니다. */
  flush(): Promise<void>;
}

export interface DraftStorage {
  load(): Promise<string | null>;
  save(value: string): Promise<void>;
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
    widthCm: 420,
    heightCm: 520,
  },
  boundaries: [
    { id: 'wall-north', x1: 0, y1: 0, x2: 420, y2: 0, thickness: 10 },
    { id: 'wall-east', x1: 420, y1: 0, x2: 420, y2: 520, thickness: 10 },
    { id: 'wall-south', x1: 420, y1: 520, x2: 0, y2: 520, thickness: 10 },
    { id: 'wall-west', x1: 0, y1: 520, x2: 0, y2: 0, thickness: 10 },
  ],
  entries: [{ id: 'door-entry', wallId: 'wall-south', x: 170, y: 520, width: 80 }],
  glazedOpenings: [{ id: 'window-main', wallId: 'wall-north', x: 104, y: 0, width: 160 }],
  detectedFurniture: [
    { id: 'bed-main', type: 'bed', x: 28, y: 48, width: 160, height: 210, rotation: 0 },
    { id: 'desk-window', type: 'desk', x: 270, y: 60, width: 112, height: 60, rotation: 0 },
    { id: 'wardrobe-entry', type: 'wardrobe', x: 292, y: 340, width: 90, height: 140, rotation: 0 },
  ],
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

export function createScanDraftRepository(
  { storage, saveDelayMs = 400 }: { storage?: DraftStorage; saveDelayMs?: number } = {},
): ScanDraftRepository {
  const drafts = new Map<string, RoomFloorPlan>();
  let latestDraftId: string | undefined;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;

  // 드래그 중에는 매 프레임 수정되므로, 잠시 모았다가 마지막 초안 하나만 저장합니다.
  const save = async () => {
    clearTimeout(saveTimer);
    saveTimer = undefined;
    const plan = latestDraftId ? drafts.get(latestDraftId) : undefined;
    if (!storage || !latestDraftId || !plan) return;
    try {
      await storage.save(serializeDraft({ id: latestDraftId, plan }));
    } catch (error) {
      console.warn('초안을 기기에 저장하지 못했습니다.', error);
    }
  };
  const set = (draftId: string, plan: RoomFloorPlan) => {
    drafts.set(draftId, plan);
    latestDraftId = draftId;
    if (storage && !saveTimer) saveTimer = setTimeout(() => { void save(); }, saveDelayMs);
    return plan;
  };

  return {
    create(plan) {
      const id = `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      set(id, plan);
      return { id, plan };
    },
    get(draftId) {
      return drafts.get(draftId);
    },
    getLatestDraftId() {
      return latestDraftId;
    },
    updateOutline(draftId, { width, height, walls, doors, windows }) {
      const current = drafts.get(draftId);
      return current ? set(draftId, { ...current, width, height, walls, doors, windows }) : undefined;
    },
    updateFurniture(draftId, furniture) {
      const current = drafts.get(draftId);
      return current ? set(draftId, { ...current, furniture }) : undefined;
    },
    async hydrate() {
      if (!storage) return;
      try {
        const stored = parseStoredDraft(await storage.load());
        if (stored && !drafts.has(stored.id)) {
          drafts.set(stored.id, stored.plan);
          latestDraftId ??= stored.id;
        }
      } catch (error) {
        console.warn('저장된 초안을 불러오지 못했습니다.', error);
      }
    },
    flush: save,
  };
}
