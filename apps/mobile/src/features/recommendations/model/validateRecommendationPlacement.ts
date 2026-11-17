import type { FurnitureItem, RecommendationLayout, RoomFloorPlan, RoomStyle } from '@restructuring-home/domain';
import { getFurnitureUse } from '../../furniture/catalog/getFurnitureCatalogItem';
import { getWallBounds, type OutlinePoint } from '../../room-plan/model/roomOutline';
import { createRoomFit } from '../../furniture/model/roomFit';
import { findChairPairs, keepsChairPairs } from './chairPairing';
import { getDoorClearances, getFurnitureClearance } from './furnitureClearance';
import { footprintsOverlap, getFootprint } from '../../furniture/model/placementGeometry';
import { scoreFurnitureUse } from './rankRecommendationPlacement';

export function validateRecommendationPlacements(
  layouts: RecommendationLayout[],
  plan: RoomFloorPlan,
  style: RoomStyle,
): RecommendationLayout[] {
  const roomFit = createRoomFit(plan);
  const originals = new Map(plan.furniture.map((item) => [item.id, item]));
  const uses = new Map(plan.furniture.map((item) => [item.id, getFurnitureUse(item)]));
  const doors = getDoorClearances(plan);
  const chairPairs = findChairPairs(plan.furniture);
  const findIssue = (item: FurnitureItem, placed: FurnitureItem[]): string | undefined => {
    const footprint = getFootprint(item);
    const use = uses.get(item.id)!;
    const clearance = getFurnitureClearance(item, use);
    if (!roomFit.fitsFootprint(footprint)) return '벽 밖으로 나감';
    if (clearance && !roomFit.fitsFootprint(clearance)) return '앞쪽 사용 공간이 벽에 막힘';
    if (!use.allowsFurnitureOnTop && doors.some((door) => footprintsOverlap(door, footprint))) return '출입문 앞을 막음';

    const blocker = placed.find((other) => {
      const otherUse = uses.get(other.id)!;
      const otherFootprint = getFootprint(other);
      const otherClearance = getFurnitureClearance(other, otherUse);
      const sharesFloor = Boolean(use.allowsFurnitureOnTop) !== Boolean(otherUse.allowsFurnitureOnTop);
      return !((sharesFloor || !footprintsOverlap(footprint, otherFootprint)) &&
        (!clearance || otherUse.allowsFurnitureOnTop || !footprintsOverlap(clearance, otherFootprint)) &&
        (!otherClearance || use.allowsFurnitureOnTop || !footprintsOverlap(otherClearance, footprint)));
    });
    return blocker ? `${describe(blocker)}와(과) 겹치거나 사용 공간을 막음` : undefined;
  };
  const fits = (item: FurnitureItem, placed: FurnitureItem[]) => !findIssue(item, placed);
  const findLayoutIssue = (furniture: FurnitureItem[]): string | undefined => {
    for (const [index, item] of furniture.entries()) {
      const issue = findIssue(item, furniture.slice(0, index));
      if (issue) return `${describe(item)}: ${issue}`;
    }
    return keepsChairPairs(furniture, chairPairs) ? undefined : '의자와 책상·식탁 짝이 떨어짐';
  };
  const allFit = (furniture: FurnitureItem[]) => furniture.every((item, index) => fits(item, furniture.slice(0, index)));

  const checked = layouts.flatMap((layout): RecommendationLayout[] => {
    const furniture = restoreFurniture(layout.furniture, originals);
    if (!furniture) logRejection(layout.id, '가구 목록이 원본과 다름');
    return furniture ? [{ ...layout, furniture, source: 'ai' }] : [];
  });
  const valid = checked.filter(({ id, furniture }) => {
    const issue = findLayoutIssue(furniture);
    if (issue) logRejection(id, issue);
    return !issue;
  });
  if (valid.length) {
    return valid.map((layout) => ({ layout, score: scoreFurnitureUse(layout.furniture) }))
      .sort((a, b) => b.score - a.score)
      .map(({ layout }) => layout);
  }

  if (!plan.furniture.length) return [];
  const currentFits = allFit(plan.furniture);
  const preferences = checked.length ? checked.map(({ furniture }) => furniture) : [plan.furniture];
  for (const preferred of preferences) {
    const adjusted = placeFurniture(plan, preferred, fits);
    if (adjusted && keepsChairPairs(adjusted, chairPairs) &&
        !adjusted.every((item, index) => hasSamePlacement(item, plan.furniture[index]))) {
      return [{ id: 'adjusted-layout', style, furniture: adjusted, source: 'adjusted',
        reason: '벽, 출입구, 가구 앞 공간을 확보하도록 앱에서 배치를 조정했어요.' }];
    }
  }
  return currentFits ? [{ id: 'current-layout', style, furniture: plan.furniture, source: 'current',
    reason: '조건을 만족하는 새 추천을 찾지 못해 현재 배치를 표시했어요.' }] : [];
}

function describe(item: FurnitureItem): string {
  return item.label ?? item.id;
}

// AI 추천이 얼마나, 왜 탈락하는지 개발 중에 확인하기 위한 로그입니다.
function logRejection(layoutId: string, reason: string) {
  if ((globalThis as { __DEV__?: boolean }).__DEV__) {
    console.warn(`[recommendation] ${layoutId} 탈락: ${reason}`);
  }
}

function hasSamePlacement(first: FurnitureItem, second: FurnitureItem): boolean {
  return first.x === second.x && first.y === second.y && (first.rotation - second.rotation) % 360 === 0;
}

function restoreFurniture(proposals: FurnitureItem[], originals: Map<string, FurnitureItem>): FurnitureItem[] | undefined {
  if (proposals.length !== originals.size) return undefined;
  const restored = new Map<string, FurnitureItem>();
  for (const proposal of proposals) {
    if (!proposal || !Number.isFinite(proposal.x) || !Number.isFinite(proposal.y) || !Number.isFinite(proposal.rotation)) return undefined;
    const original = originals.get(proposal.id);
    if (!original || proposal.type !== original.type || restored.has(original.id)) return undefined;
    restored.set(original.id, {
      ...original,
      x: proposal.x,
      y: proposal.y,
      rotation: ((proposal.rotation % 360) + 360) % 360,
    });
  }
  return [...restored.values()];
}

function placeFurniture(
  plan: RoomFloorPlan,
  preferred: FurnitureItem[],
  fits: (item: FurnitureItem, placed: FurnitureItem[]) => boolean,
): FurnitureItem[] | undefined {
  const desiredById = new Map(preferred.map((item) => [item.id, item]));
  const largestFirst = [...plan.furniture].sort((a, b) => b.width * b.height - a.width * a.height);
  const placed: FurnitureItem[] = [];
  for (const item of largestFirst) {
    const desired = desiredById.get(item.id) ?? item;
    const position = [desired, item].find((candidate) => fits(candidate, placed))
      ?? findNearbyPlacement(plan.walls, desired, (candidate) => fits(candidate, placed));
    if (!position) return undefined;
    placed.push(position);
  }

  const byId = new Map(placed.map((item) => [item.id, item]));
  return plan.furniture.map((item) => byId.get(item.id) ?? item);
}

function findNearbyPlacement(
  walls: RoomFloorPlan['walls'], item: FurnitureItem, fits: (item: FurnitureItem) => boolean,
) {
  const roomBounds = getWallBounds(walls);
  const step = Math.max(10, Math.max(roomBounds.maxX - roomBounds.minX, roomBounds.maxY - roomBounds.minY) / 30);
  const rotations = new Set([item.rotation, 0, 90, 180, 270]);
  const points: Array<{ item: FurnitureItem; distance: number }> = [];
  for (const rotation of rotations) {
    const origin = { ...item, x: 0, y: 0, rotation };
    const footprint = getFootprint(origin);
    const clearance = getFurnitureClearance(origin, getFurnitureUse(item));
    const outline = 'vertices' in footprint ? footprint.vertices : [
      { x: footprint.center.x - footprint.radius, y: footprint.center.y - footprint.radius },
      { x: footprint.center.x + footprint.radius, y: footprint.center.y + footprint.radius },
    ];
    const bounds = getBounds(clearance ? [...outline, ...clearance.vertices] : outline);
    const xs = searchAxis(roomBounds.minX - bounds.minX, roomBounds.maxX - bounds.maxX, item.x, step);
    const ys = searchAxis(roomBounds.minY - bounds.minY, roomBounds.maxY - bounds.maxY, item.y, step);
    for (const wall of walls) {
      const half = wall.thickness / 2;
      if (wall.x1 === wall.x2) {
        addAxisAnchor(xs, wall.x1 + half - bounds.minX);
        addAxisAnchor(xs, wall.x1 - half - bounds.maxX);
      }
      if (wall.y1 === wall.y2) {
        addAxisAnchor(ys, wall.y1 + half - bounds.minY);
        addAxisAnchor(ys, wall.y1 - half - bounds.maxY);
      }
    }
    for (const x of xs.values) {
      for (const y of ys.values) points.push({ item: { ...item, x, y, rotation }, distance: Math.hypot(item.x - x, item.y - y) });
    }
  }
  points.sort((a, b) => a.distance - b.distance);
  return points.find(({ item: candidate }) => fits(candidate))?.item;
}

function getBounds(points: OutlinePoint[]) {
  return {
    minX: Math.min(...points.map(({ x }) => x)), maxX: Math.max(...points.map(({ x }) => x)),
    minY: Math.min(...points.map(({ y }) => y)), maxY: Math.max(...points.map(({ y }) => y)),
  };
}

function searchAxis(min: number, max: number, preferred: number, step: number) {
  const axis = { min, max, values: new Set<number>() };
  addAxisAnchor(axis, preferred);
  addAxisAnchor(axis, (min + max) / 2);
  addAxisAnchor(axis, max);
  const steps = Math.floor((max - min) / step);
  for (let index = 0; index <= steps; index += 1) addAxisAnchor(axis, min + index * step);
  return axis;
}

function addAxisAnchor(axis: ReturnType<typeof searchAxis>, coordinate: number) {
  if (coordinate >= axis.min && coordinate <= axis.max) axis.values.add(coordinate);
}
