import type { RoomFloorPlan } from '@restructuring-home/domain';
import { getOutlineVertices, insertOutlineVertex, moveOutlineVertex, resizeRoomOutline, validateRoomOutline } from './roomOutline';

const plan: RoomFloorPlan = {
  width: 420,
  height: 520,
  walls: [
    { id: 'north', x1: 0, y1: 0, x2: 420, y2: 0, thickness: 10 },
    { id: 'east', x1: 420, y1: 0, x2: 420, y2: 520, thickness: 10 },
    { id: 'south', x1: 420, y1: 520, x2: 0, y2: 520, thickness: 10 },
    { id: 'west', x1: 0, y1: 520, x2: 0, y2: 0, thickness: 10 },
  ],
  doors: [],
  windows: [],
  furniture: [],
};

const movedPlan = moveOutlineVertex(plan, 1, { x: 480, y: 40 });
const vertices = getOutlineVertices(movedPlan);

assertEqual(vertices[1].x, 480, 'moves selected vertex x');
assertEqual(vertices[1].y, 40, 'moves selected vertex y');
assertEqual(movedPlan.walls[0].x2, 480, 'updates previous wall end');
assertEqual(movedPlan.walls[1].x1, 480, 'updates next wall start');
assertEqual(movedPlan.width, 480, 'updates outline width');
assertEqual(movedPlan.height, 520, 'updates outline height');
assertEqual(validateRoomOutline(movedPlan).isValid, true, 'keeps valid outline');

const resizedPlan = resizeRoomOutline(plan, 840, 260);
assertEqual(resizedPlan.walls[1].x1, 840, 'scales width');
assertEqual(resizedPlan.walls[2].y1, 260, 'scales height');

const expandedPlan = insertOutlineVertex(plan, 1);
assertEqual(expandedPlan.walls.length, 5, 'adds a wall segment');
assertEqual(getOutlineVertices(expandedPlan)[2].x, 420, 'inserts midpoint x');
assertEqual(getOutlineVertices(expandedPlan)[2].y, 260, 'inserts midpoint y');

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}
