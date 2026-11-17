import type { Opening, RoomFloorPlan, Wall } from '@restructuring-home/domain';
import { getOpeningSegment } from './openingSegment';

export interface OutlinePoint {
  x: number;
  y: number;
}

export interface RoomOutlineValidation {
  isValid: boolean;
  message?: string;
}

export const MIN_WALL_LENGTH_CM = 30;

export function getOutlineVertices(plan: RoomFloorPlan): OutlinePoint[] {
  return plan.walls.map((wall) => ({ x: wall.x1, y: wall.y1 }));
}

export function getWallBounds(walls: Wall[]) {
  const xs = walls.flatMap(({ x1, x2 }) => [x1, x2]);
  const ys = walls.flatMap(({ y1, y2 }) => [y1, y2]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

export function moveOutlineVertex(
  plan: RoomFloorPlan,
  vertexIndex: number,
  point: OutlinePoint,
): RoomFloorPlan {
  const vertices = getOutlineVertices(plan);

  if (!vertices[vertexIndex]) {
    return plan;
  }

  vertices[vertexIndex] = {
    x: Math.max(0, Math.round(point.x)),
    y: Math.max(0, Math.round(point.y)),
  };

  return buildPlanFromVertices(plan, vertices);
}

export function insertOutlineVertex(plan: RoomFloorPlan, wallIndex: number): RoomFloorPlan {
  const wall = plan.walls[wallIndex];

  if (!wall || plan.doors.some((opening) => opening.wallId === wall.id) || plan.windows.some((opening) => opening.wallId === wall.id)) {
    return plan;
  }

  const midpoint = {
    x: Math.round((wall.x1 + wall.x2) / 2),
    y: Math.round((wall.y1 + wall.y2) / 2),
  };
  const insertedWall: Wall = {
    ...wall,
    id: createInsertedWallId(plan.walls, wall.id),
    x1: midpoint.x,
    y1: midpoint.y,
  };
  const walls = plan.walls.flatMap((currentWall, index) => (
    index === wallIndex
      ? [{ ...currentWall, x2: midpoint.x, y2: midpoint.y }, insertedWall]
      : [currentWall]
  ));

  return { ...plan, walls };
}

export function resizeRoomOutline(plan: RoomFloorPlan, width: number, height: number): RoomFloorPlan {
  const nextWidth = Math.max(MIN_WALL_LENGTH_CM, Math.round(width));
  const nextHeight = Math.max(MIN_WALL_LENGTH_CM, Math.round(height));
  const widthScale = nextWidth / Math.max(plan.width, MIN_WALL_LENGTH_CM);
  const heightScale = nextHeight / Math.max(plan.height, MIN_WALL_LENGTH_CM);
  const vertices = getOutlineVertices(plan).map((point) => ({
    x: Math.round(point.x * widthScale),
    y: Math.round(point.y * heightScale),
  }));

  return buildPlanFromVertices(plan, vertices);
}

export function validateRoomOutline(plan: RoomFloorPlan): RoomOutlineValidation {
  const vertices = getOutlineVertices(plan);
  if (!Number.isFinite(plan.width) || !Number.isFinite(plan.height) || plan.width <= 0 || plan.height <= 0) {
    return { isValid: false, message: '방의 가로와 세로 치수를 확인해 주세요.' };
  }

  if (vertices.length < 3) {
    return { isValid: false, message: '방은 최소 세 개의 벽으로 이루어져야 합니다.' };
  }

  if (vertices.some(({ x, y }) => !Number.isFinite(x) || !Number.isFinite(y))) {
    return { isValid: false, message: '벽 꼭짓점의 좌표를 확인해 주세요.' };
  }

  for (let index = 0; index < plan.walls.length; index += 1) {
    const wall = plan.walls[index];
    const nextWall = plan.walls[(index + 1) % plan.walls.length];

    if (distance({ x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 }) < MIN_WALL_LENGTH_CM) {
      return { isValid: false, message: `벽 ${index + 1}의 길이는 ${MIN_WALL_LENGTH_CM}cm 이상이어야 합니다.` };
    }

    if (wall.x2 !== nextWall.x1 || wall.y2 !== nextWall.y1) {
      return { isValid: false, message: '방 벽은 끊기지 않고 닫힌 형태여야 합니다.' };
    }

    const start = vertices[index];
    const corner = vertices[(index + 1) % vertices.length];
    const end = vertices[(index + 2) % vertices.length];
    const direction = (corner.x - start.x) * (end.x - corner.x) + (corner.y - start.y) * (end.y - corner.y);
    if (cross(start, corner, end) === 0 && direction < 0) {
      return { isValid: false, message: '이웃한 벽이 서로 포개지지 않도록 조절해 주세요.' };
    }
  }

  for (let first = 0; first < vertices.length; first += 1) {
    for (let second = first + 1; second < vertices.length; second += 1) {
      if (areAdjacentEdges(first, second, vertices.length)) {
        continue;
      }

      if (segmentsIntersect(
        vertices[first],
        vertices[(first + 1) % vertices.length],
        vertices[second],
        vertices[(second + 1) % vertices.length],
      )) {
        return { isValid: false, message: '방 벽이 서로 교차하지 않도록 조절해 주세요.' };
      }
    }
  }

  const twiceArea = vertices.reduce((area, point, index) => {
    const next = vertices[(index + 1) % vertices.length];
    return area + point.x * next.y - point.y * next.x;
  }, 0);
  if (Math.abs(twiceArea) < 0.000001) {
    return { isValid: false, message: '벽으로 둘러싸인 방의 면적이 필요해요.' };
  }

  return { isValid: true };
}

function buildPlanFromVertices(plan: RoomFloorPlan, vertices: OutlinePoint[]): RoomFloorPlan {
  const walls = plan.walls.map((wall, index) => ({
    ...wall,
    x1: vertices[index].x,
    y1: vertices[index].y,
    x2: vertices[(index + 1) % vertices.length].x,
    y2: vertices[(index + 1) % vertices.length].y,
  }));

  return {
    ...plan,
    width: Math.max(...vertices.map((point) => point.x), MIN_WALL_LENGTH_CM),
    height: Math.max(...vertices.map((point) => point.y), MIN_WALL_LENGTH_CM),
    walls,
    doors: relocateOpenings(plan.doors, plan.walls, walls),
    windows: relocateOpenings(plan.windows, plan.walls, walls),
  };
}

function relocateOpenings(openings: Opening[], previousWalls: Wall[], nextWalls: Wall[]): Opening[] {
  return openings.map((opening) => {
    const previousWall = previousWalls.find((wall) => wall.id === opening.wallId);
    const nextWall = nextWalls.find((wall) => wall.id === opening.wallId);

    if (!previousWall || !nextWall) {
      return opening;
    }

    const position = getRelativePosition(opening, previousWall);

    const relocated = {
      ...opening,
      x: Math.round(nextWall.x1 + (nextWall.x2 - nextWall.x1) * position),
      y: Math.round(nextWall.y1 + (nextWall.y2 - nextWall.y1) * position),
    };
    const segment = getOpeningSegment(relocated, nextWall);
    return segment ? { ...relocated, ...segment.start } : relocated;
  });
}

function createInsertedWallId(walls: Wall[], wallId: string): string {
  let number = 1;
  let id = `${wallId}-segment-${number}`;
  const existingIds = new Set(walls.map((wall) => wall.id));

  while (existingIds.has(id)) {
    number += 1;
    id = `${wallId}-segment-${number}`;
  }

  return id;
}

function getRelativePosition(opening: Opening, wall: Wall): number {
  const deltaX = wall.x2 - wall.x1;
  const deltaY = wall.y2 - wall.y1;
  const denominator = deltaX * deltaX + deltaY * deltaY;

  if (denominator === 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, ((opening.x - wall.x1) * deltaX + (opening.y - wall.y1) * deltaY) / denominator));
}

function distance(first: OutlinePoint, second: OutlinePoint): number {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function areAdjacentEdges(first: number, second: number, total: number): boolean {
  return second === first + 1 || (first === 0 && second === total - 1);
}

function segmentsIntersect(firstStart: OutlinePoint, firstEnd: OutlinePoint, secondStart: OutlinePoint, secondEnd: OutlinePoint): boolean {
  const firstDirection = cross(firstStart, firstEnd, secondStart);
  const secondDirection = cross(firstStart, firstEnd, secondEnd);
  const thirdDirection = cross(secondStart, secondEnd, firstStart);
  const fourthDirection = cross(secondStart, secondEnd, firstEnd);

  return (firstDirection * secondDirection < 0 && thirdDirection * fourthDirection < 0) ||
    (firstDirection === 0 && isBetween(secondStart, firstStart, firstEnd)) ||
    (secondDirection === 0 && isBetween(secondEnd, firstStart, firstEnd)) ||
    (thirdDirection === 0 && isBetween(firstStart, secondStart, secondEnd)) ||
    (fourthDirection === 0 && isBetween(firstEnd, secondStart, secondEnd));
}

function isBetween(point: OutlinePoint, start: OutlinePoint, end: OutlinePoint): boolean {
  return point.x >= Math.min(start.x, end.x) && point.x <= Math.max(start.x, end.x) &&
    point.y >= Math.min(start.y, end.y) && point.y <= Math.max(start.y, end.y);
}

function cross(origin: OutlinePoint, first: OutlinePoint, second: OutlinePoint): number {
  return (first.x - origin.x) * (second.y - origin.y) - (first.y - origin.y) * (second.x - origin.x);
}
