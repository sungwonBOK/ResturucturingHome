import type { FurnitureItem, RoomFloorPlan } from '@restructuring-home/domain';
import { getRoomInterior } from '../../room-plan/model/roomInterior';
import { getOutlineVertices, validateRoomOutline } from '../../room-plan/model/roomOutline';
import { fitsRoom, getFootprint, type Footprint } from './placementGeometry';

export interface RoomBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface RoomFit {
  /** 가구가 벽 안쪽 면으로 둘러싸인 바닥 안에 완전히 들어가는지 */
  fits(item: FurnitureItem): boolean;
  fitsFootprint(footprint: Footprint): boolean;
  /** 벽 안쪽 바닥을 감싸는 사각형. 드래그 위치를 1차로 제한할 때 씁니다. */
  interiorBounds: RoomBounds;
}

// 편집기, 추천 검증, 추천 요청 전 확인이 모두 이 규칙 하나로 "방 안"을 판단합니다.
export function createRoomFit(plan: RoomFloorPlan): RoomFit {
  if (!validateRoomOutline(plan).isValid) {
    // 벽이 아직 없거나 닫히지 않은 도면은 가로·세로 사각형을 방으로 봅니다.
    const bounds = { minX: 0, minY: 0, maxX: plan.width, maxY: plan.height };
    const fitsFootprint = (footprint: Footprint) => footprintWithin(footprint, bounds);
    return { fits: (item) => fitsFootprint(getFootprint(item)), fitsFootprint, interiorBounds: bounds };
  }

  const room = getOutlineVertices(plan);
  const wallWidths = plan.walls.map((wall) => wall.thickness);
  const interior = getRoomInterior(plan);
  const fitsFootprint = (footprint: Footprint) => fitsRoom(footprint, room, wallWidths);
  return {
    fits: (item) => fitsFootprint(getFootprint(item)),
    fitsFootprint,
    interiorBounds: {
      minX: Math.min(...interior.map(({ x }) => x)),
      minY: Math.min(...interior.map(({ y }) => y)),
      maxX: Math.max(...interior.map(({ x }) => x)),
      maxY: Math.max(...interior.map(({ y }) => y)),
    },
  };
}

export function findFurnitureOutsideRoom(plan: RoomFloorPlan): FurnitureItem[] {
  const fit = createRoomFit(plan);
  return plan.furniture.filter((item) => !fit.fits(item));
}

const EPSILON = 0.000001;

function footprintWithin(footprint: Footprint, bounds: RoomBounds): boolean {
  const points = 'center' in footprint
    ? [
      { x: footprint.center.x - footprint.radius, y: footprint.center.y - footprint.radius },
      { x: footprint.center.x + footprint.radius, y: footprint.center.y + footprint.radius },
    ]
    : footprint.vertices;
  return points.every(({ x, y }) => (
    x >= bounds.minX - EPSILON && x <= bounds.maxX + EPSILON && y >= bounds.minY - EPSILON && y <= bounds.maxY + EPSILON
  ));
}
