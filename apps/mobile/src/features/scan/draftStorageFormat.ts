import type { RoomFloorPlan } from '@restructuring-home/domain';
import { validateRoomOutline } from '../room-plan/model/roomOutline';

const STORAGE_VERSION = 1;

export interface StoredDraft {
  id: string;
  plan: RoomFloorPlan;
}

export function serializeDraft(draft: StoredDraft): string {
  return JSON.stringify({ version: STORAGE_VERSION, draft });
}

// 기기에 저장된 값은 앱 업데이트·강제 종료로 깨질 수 있으므로, 하나라도 이상하면 버리고 새로 시작합니다.
export function parseStoredDraft(raw: string | null): StoredDraft | undefined {
  if (!raw) return undefined;

  try {
    const value = JSON.parse(raw) as { version?: unknown; draft?: { id?: unknown; plan?: unknown } };
    const id = value.draft?.id;
    const plan = value.draft?.plan;
    if (value.version !== STORAGE_VERSION || typeof id !== 'string' || !id || !isRoomFloorPlan(plan)) return undefined;
    return { id, plan };
  } catch {
    return undefined;
  }
}

function isRoomFloorPlan(value: unknown): value is RoomFloorPlan {
  const plan = value as RoomFloorPlan;
  return Boolean(plan) &&
    [plan.walls, plan.doors, plan.windows, plan.furniture].every(Array.isArray) &&
    plan.walls.every((wall) => isId(wall.id) && finite(wall.x1, wall.y1, wall.x2, wall.y2) && positive(wall.thickness)) &&
    [...plan.doors, ...plan.windows].every((opening) => isId(opening.id) && isId(opening.wallId) &&
      finite(opening.x, opening.y) && positive(opening.width)) &&
    plan.furniture.every((item) => isId(item.id) && isId(item.type) && finite(item.x, item.y, item.rotation) &&
      positive(item.width, item.height)) &&
    validateRoomOutline(plan).isValid;
}

function isId(value: unknown): boolean {
  return typeof value === 'string' && value.length > 0;
}

function finite(...values: unknown[]): boolean {
  return values.every((value) => typeof value === 'number' && Number.isFinite(value));
}

function positive(...values: unknown[]): boolean {
  return finite(...values) && values.every((value) => (value as number) > 0);
}
