import type { Opening, RoomFloorPlan, Wall } from '@restructuring-home/domain';
import { getOpeningSegment } from './openingSegment';
import type { OutlinePoint } from './roomOutline';

export type OpeningKind = 'door' | 'window';

export const MIN_OPENING_WIDTH_CM = 40;
const DEFAULT_OPENING_WIDTH_CM: Record<OpeningKind, number> = { door: 90, window: 120 };
const EPSILON = 0.001;

/** 벽 시작점(x1, y1)에서 잰 문·창의 구간(cm). */
export interface OpeningRange {
  start: number;
  end: number;
}

export type PlanTarget = { kind: 'opening'; id: string } | { kind: 'wall'; id: string };

export function addOpening(plan: RoomFloorPlan, kind: OpeningKind, wallId: string): RoomFloorPlan {
  const wall = plan.walls.find(({ id }) => id === wallId);
  if (!wall) return plan;

  const length = getWallLength(wall);
  const center = length / 2;
  const gap = getFreeGaps(plan, wall, length)
    .filter(({ start, end }) => end - start >= MIN_OPENING_WIDTH_CM)
    .sort((a, b) => distanceToGap(center, a) - distanceToGap(center, b) || (b.end - b.start) - (a.end - a.start))[0];
  if (!gap) throw new Error('이 벽에는 문·창을 놓을 자리가 부족해요.');

  const width = Math.min(DEFAULT_OPENING_WIDTH_CM[kind], gap.end - gap.start);
  const start = clamp(center - width / 2, gap.start, gap.end - width);
  const opening: Opening = { id: createOpeningId(plan, kind), wallId, width, ...toOpeningPoint(wall, start, width) };
  return kind === 'door' ? { ...plan, doors: [...plan.doors, opening] } : { ...plan, windows: [...plan.windows, opening] };
}

/** 문·창을 벽을 따라 옮깁니다. 벽 끝과 이웃한 문·창을 넘어가지 않습니다. */
export function moveOpening(plan: RoomFloorPlan, openingId: string, desiredStart: number): RoomFloorPlan {
  return updateOpening(plan, openingId, (opening, wall, range) => {
    const gap = getSurroundingGap(plan, wall, opening.id, range);
    const start = clamp(desiredStart, gap.start, gap.end - opening.width);
    return { ...opening, ...toOpeningPoint(wall, start, opening.width) };
  });
}

export function setOpeningWidth(plan: RoomFloorPlan, openingId: string, width: number): RoomFloorPlan {
  if (!Number.isFinite(width) || width < MIN_OPENING_WIDTH_CM) {
    throw new Error(`문·창 폭은 ${MIN_OPENING_WIDTH_CM}cm 이상이어야 해요.`);
  }

  return updateOpening(plan, openingId, (opening, wall, range) => {
    const gap = getSurroundingGap(plan, wall, opening.id, range);
    if (gap.end - gap.start < width - EPSILON) throw new Error('이 폭은 벽의 빈 자리에 들어가지 않아요.');
    const start = clamp(range.start, gap.start, gap.end - width);
    return { ...opening, width, ...toOpeningPoint(wall, start, width) };
  });
}

export function removeOpening(plan: RoomFloorPlan, openingId: string): RoomFloorPlan {
  return {
    ...plan,
    doors: plan.doors.filter(({ id }) => id !== openingId),
    windows: plan.windows.filter(({ id }) => id !== openingId),
  };
}

export function getOpeningRange(plan: RoomFloorPlan, openingId: string): OpeningRange | undefined {
  const opening = findOpening(plan, openingId);
  const wall = opening && plan.walls.find(({ id }) => id === opening.wallId);
  return opening && wall ? getRangeOnWall(opening, wall) : undefined;
}

/** 도면 좌표의 한 점에서 가장 가까운 문·창, 없으면 벽을 찾습니다. tolerance는 cm입니다. */
export function findPlanTarget(plan: RoomFloorPlan, point: OutlinePoint, tolerance: number): PlanTarget | undefined {
  const opening = nearest([...plan.doors, ...plan.windows].flatMap((item) => {
    const wall = plan.walls.find(({ id }) => id === item.wallId);
    const segment = wall && getOpeningSegment(item, wall);
    return segment ? [{ id: item.id, distance: distanceToSegment(point, segment.start, segment.end) }] : [];
  }), tolerance);
  if (opening) return { kind: 'opening', id: opening.id };

  const wall = nearest(plan.walls.map((item) => ({
    id: item.id,
    distance: distanceToSegment(point, { x: item.x1, y: item.y1 }, { x: item.x2, y: item.y2 }) - item.thickness / 2,
  })), tolerance);
  return wall ? { kind: 'wall', id: wall.id } : undefined;
}

export function findOpening(plan: RoomFloorPlan, openingId: string): Opening | undefined {
  return plan.doors.find(({ id }) => id === openingId) ?? plan.windows.find(({ id }) => id === openingId);
}

export function getWallLength(wall: Wall): number {
  return Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
}

function updateOpening(
  plan: RoomFloorPlan,
  openingId: string,
  update: (opening: Opening, wall: Wall, range: OpeningRange) => Opening,
): RoomFloorPlan {
  const opening = findOpening(plan, openingId);
  const wall = opening && plan.walls.find(({ id }) => id === opening.wallId);
  const range = opening && wall && getRangeOnWall(opening, wall);
  if (!opening || !wall || !range) return plan;

  const next = update(opening, wall, range);
  const replace = (items: Opening[]) => items.map((item) => (item.id === openingId ? next : item));
  return { ...plan, doors: replace(plan.doors), windows: replace(plan.windows) };
}

function getRangeOnWall(opening: Opening, wall: Wall): OpeningRange | undefined {
  const segment = getOpeningSegment(opening, wall);
  if (!segment) return undefined;
  const along = (point: OutlinePoint) => (point.x - wall.x1) * segment.tangent.x + (point.y - wall.y1) * segment.tangent.y;
  const [start, end] = [along(segment.start), along(segment.end)].sort((a, b) => a - b);
  return { start: round(start), end: round(end) };
}

// getOpeningSegment는 벽의 주된 축 방향으로 시작점에서 폭만큼 뻗는다고 해석하므로, 그 규칙에 맞는 시작점을 저장합니다.
function toOpeningPoint(wall: Wall, start: number, width: number): OutlinePoint {
  const dx = wall.x2 - wall.x1;
  const dy = wall.y2 - wall.y1;
  const length = getWallLength(wall);
  const direction = Math.sign(Math.abs(dx) >= Math.abs(dy) ? dx : dy);
  const along = direction > 0 ? start : start + width;
  return { x: round(wall.x1 + (dx / length) * along), y: round(wall.y1 + (dy / length) * along) };
}

function getOccupied(plan: RoomFloorPlan, wall: Wall, exceptId?: string): OpeningRange[] {
  return [...plan.doors, ...plan.windows]
    .filter((item) => item.wallId === wall.id && item.id !== exceptId)
    .flatMap((item) => getRangeOnWall(item, wall) ?? [])
    .sort((a, b) => a.start - b.start);
}

function getFreeGaps(plan: RoomFloorPlan, wall: Wall, length: number): OpeningRange[] {
  const gaps: OpeningRange[] = [];
  let cursor = 0;
  for (const range of getOccupied(plan, wall)) {
    if (range.start > cursor) gaps.push({ start: cursor, end: range.start });
    cursor = Math.max(cursor, range.end);
  }
  if (length > cursor) gaps.push({ start: cursor, end: length });
  return gaps;
}

function getSurroundingGap(plan: RoomFloorPlan, wall: Wall, openingId: string, range: OpeningRange): OpeningRange {
  const others = getOccupied(plan, wall, openingId);
  const start = Math.max(0, ...others.filter((other) => other.end <= range.start + EPSILON).map((other) => other.end));
  const end = Math.min(getWallLength(wall), ...others.filter((other) => other.start >= range.end - EPSILON).map((other) => other.start));
  return { start, end };
}

function createOpeningId(plan: RoomFloorPlan, kind: OpeningKind): string {
  const existing = new Set([...plan.doors, ...plan.windows].map(({ id }) => id));
  let number = 1;
  while (existing.has(`${kind}-${number}`)) number += 1;
  return `${kind}-${number}`;
}

function nearest<T extends { distance: number }>(items: T[], tolerance: number): T | undefined {
  return items.filter(({ distance }) => distance <= tolerance).sort((a, b) => a.distance - b.distance)[0];
}

function distanceToGap(value: number, gap: OpeningRange): number {
  return value < gap.start ? gap.start - value : value > gap.end ? value - gap.end : 0;
}

function distanceToSegment(point: OutlinePoint, start: OutlinePoint, end: OutlinePoint): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared ? clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared, 0, 1) : 0;
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
