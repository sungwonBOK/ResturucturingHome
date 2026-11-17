import type { RoomFloorPlan } from '@restructuring-home/domain';
import { validateRoomOutline, type OutlinePoint } from './roomOutline';

// 벽 좌표는 벽 중심선입니다. 실제로 가구를 놓을 수 있는 바닥은
// 각 벽을 두께의 절반만큼 방 안쪽으로 민 선들이 만나는 다각형입니다.
export function getRoomInterior(plan: RoomFloorPlan): OutlinePoint[] {
  if (!validateRoomOutline(plan).isValid) return [];

  const { walls } = plan;
  const winding = Math.sign(walls.reduce((area, wall) => area + wall.x1 * wall.y2 - wall.x2 * wall.y1, 0));
  const lines = walls.map((wall) => {
    const length = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
    const direction = { x: (wall.x2 - wall.x1) / length, y: (wall.y2 - wall.y1) / length };
    const inward = { x: -direction.y * winding, y: direction.x * winding };
    const inset = wall.thickness / 2;
    return { point: { x: wall.x1 + inward.x * inset, y: wall.y1 + inward.y * inset }, direction };
  });

  return lines.map((line, index) => {
    const previous = lines[(index - 1 + lines.length) % lines.length];
    return roundPoint(intersect(previous, line) ?? line.point);
  });
}

interface Line {
  point: OutlinePoint;
  direction: OutlinePoint;
}

function intersect(first: Line, second: Line): OutlinePoint | undefined {
  const denominator = first.direction.x * second.direction.y - first.direction.y * second.direction.x;
  if (Math.abs(denominator) < 1e-9) return undefined;

  const deltaX = second.point.x - first.point.x;
  const deltaY = second.point.y - first.point.y;
  const distance = (deltaX * second.direction.y - deltaY * second.direction.x) / denominator;
  return { x: first.point.x + first.direction.x * distance, y: first.point.y + first.direction.y * distance };
}

function roundPoint({ x, y }: OutlinePoint): OutlinePoint {
  return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
}
