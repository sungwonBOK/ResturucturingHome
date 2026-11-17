import { mockStudioFloorPlan } from '../../mocks/mockRoomFloorPlan';
import { getFloorPlanCanvasGeometry } from './floorPlanCanvasGeometry';

const geometry = getFloorPlanCanvasGeometry(mockStudioFloorPlan, 300, 360);

assertClose(geometry.scale, 0.75, 'scale');
assertClose(geometry.offsetX, 15, 'offsetX');
assertClose(geometry.offsetY, 0, 'offsetY');
assertEqual(geometry.walls.length, 4, 'wall count');
assertEqual(geometry.openings.length, 2, 'opening count');
assertEqual(geometry.furniture.length, 3, 'furniture count');

const northWall = geometry.walls.find((wall) => wall.id === 'wall-north');
if (!northWall) {
  throw new Error('north wall missing');
}
assertClose(northWall.x1, 15, 'north wall x1');
assertClose(northWall.y1, 0, 'north wall y1');
assertClose(northWall.x2, 285, 'north wall x2');
assertClose(northWall.y2, 0, 'north wall y2');
assertClose(northWall.thickness, 7.5, 'north wall thickness');

const entryDoor = geometry.openings.find((opening) => opening.id === 'door-entry');
if (!entryDoor) {
  throw new Error('entry door missing');
}
assertEqual(entryDoor.variant, 'door', 'entry door variant');
assertClose(entryDoor.x, 120, 'entry door x');
assertClose(entryDoor.y, 360, 'entry door y');
assertClose(entryDoor.width, 60, 'entry door width');
assertClose(entryDoor.endX, 180, 'door extends toward increasing x on the reversed south wall');

const slantedPlan = {
  ...mockStudioFloorPlan,
  walls: [{ id: 'wall-south', x1: 300, y1: 400, x2: 0, y2: 100, thickness: 10 }],
  doors: [{ id: 'slanted-door', wallId: 'wall-south', x: 100, y: 200, width: Math.SQRT2 * 60 }],
  windows: [],
};
const slantedGeometry = getFloorPlanCanvasGeometry(slantedPlan, 360, 480);
const [slantedDoor] = slantedGeometry.openings;
assertClose(slantedDoor.endX - slantedDoor.x, 60 * slantedGeometry.scale, 'slanted opening follows the wall along x');
assertClose(slantedDoor.endY - slantedDoor.y, 60 * slantedGeometry.scale, 'slanted opening follows the wall along y');

const translated = getFloorPlanCanvasGeometry({
  ...mockStudioFloorPlan,
  walls: mockStudioFloorPlan.walls.map((wall) => ({ ...wall, x1: wall.x1 + 400, x2: wall.x2 + 400, y1: wall.y1 + 500, y2: wall.y2 + 500 })),
  furniture: mockStudioFloorPlan.furniture.map((item) => ({ ...item, x: item.x + 400, y: item.y + 500 })),
}, 300, 360);
assertClose(translated.walls[0].x1, northWall.x1, 'translated plan fits on the same canvas');
assertClose(translated.walls[0].y1, northWall.y1, 'translated wall keeps the same screen y');
assertClose(translated.furniture[0].x, geometry.furniture[0].x, 'translated furniture stays aligned to its walls');

const bed = geometry.furniture.find((item) => item.id === 'bed-main');
if (!bed) {
  throw new Error('bed missing');
}
assertClose(bed.x, 33, 'bed x');
assertClose(bed.y, 30, 'bed y');
assertClose(bed.width, 112.5, 'bed width');
assertClose(bed.height, 153.75, 'bed height');

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

function assertClose(actual: number, expected: number, label: string) {
  if (!Number.isFinite(actual) || Math.abs(actual - expected) > 0.001) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}
