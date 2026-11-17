import type { FurnitureItem, FurnitureUse, RoomFloorPlan } from '@restructuring-home/domain';
import type { OutlinePoint } from '../../room-plan/model/roomOutline';
import { getOpeningSegment } from '../../room-plan/model/openingSegment';

export function getDoorClearances(plan: RoomFloorPlan) {
  const signedArea = plan.walls.reduce((area, wall) => area + wall.x1 * wall.y2 - wall.x2 * wall.y1, 0);
  const orientation = Math.sign(signedArea);
  return plan.doors.flatMap((door) => {
    const wall = plan.walls.find(({ id }) => id === door.wallId);
    if (!wall) return [];
    const segment = getOpeningSegment(door, wall);
    if (!segment) return [];
    const { start, end, tangent } = segment;
    const inward = { x: -tangent.y * orientation, y: tangent.x * orientation };
    const point = (edge: OutlinePoint, depth: number) => ({
      x: edge.x + inward.x * depth,
      y: edge.y + inward.y * depth,
    });
    const innerFace = wall.thickness / 2;
    const farEdge = innerFace + Math.min(door.width, 90);
    return [{ vertices: [point(start, innerFace), point(end, innerFace), point(end, farEdge), point(start, farEdge)] }];
  });
}

export function getFurnitureFront(item: FurnitureItem, front: FurnitureUse['front']): OutlinePoint | undefined {
  if (!front) return undefined;
  const radians = item.rotation * Math.PI / 180;
  const side = front === 'bottom' ? 1 : -1;
  return { x: -Math.sin(radians) * side, y: Math.cos(radians) * side };
}

export function getFurnitureClearance(item: FurnitureItem, use: FurnitureUse) {
  const front = getFurnitureFront(item, use.front);
  if (!front || !use.clearanceCm) return undefined;

  const center = getFurnitureCenter(item);
  const point = (side: number, depth: number) => ({
    x: center.x + front.x * depth + front.y * side,
    y: center.y + front.y * depth - front.x * side,
  });
  const edge = item.height / 2;
  const farEdge = edge + use.clearanceCm;
  const halfWidth = item.width / 2;
  return { vertices: [point(-halfWidth, edge), point(halfWidth, edge), point(halfWidth, farEdge), point(-halfWidth, farEdge)] };
}

export function getFurnitureCenter(item: FurnitureItem): OutlinePoint {
  return { x: item.x + item.width / 2, y: item.y + item.height / 2 };
}
