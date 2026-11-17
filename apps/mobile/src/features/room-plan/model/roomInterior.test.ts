import { strict as assert } from 'node:assert';
import type { RoomFloorPlan } from '@restructuring-home/domain';
import { getRoomInterior } from './roomInterior';

const rectangle: RoomFloorPlan = {
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

assert.deepEqual(getRoomInterior(rectangle), [
  { x: 5, y: 5 }, { x: 415, y: 5 }, { x: 415, y: 515 }, { x: 5, y: 515 },
], 'insets each wall by half its thickness');

const reversed = {
  ...rectangle,
  walls: [...rectangle.walls].reverse().map((wall) => ({ ...wall, x1: wall.x2, y1: wall.y2, x2: wall.x1, y2: wall.y1 })),
};
assert.deepEqual(getRoomInterior(reversed), [
  { x: 5, y: 5 }, { x: 5, y: 515 }, { x: 415, y: 515 }, { x: 415, y: 5 },
], 'insets toward the room for either wall direction');

const corners = [[0, 0], [300, 0], [300, 200], [150, 200], [150, 400], [0, 400]];
const lShape: RoomFloorPlan = {
  ...rectangle,
  walls: corners.map(([x1, y1], index) => {
    const [x2, y2] = corners[(index + 1) % corners.length];
    return { id: `w${index}`, x1, y1, x2, y2, thickness: 20 };
  }),
};
assert.deepEqual(getRoomInterior(lShape), [
  { x: 10, y: 10 }, { x: 290, y: 10 }, { x: 290, y: 190 }, { x: 140, y: 190 }, { x: 140, y: 390 }, { x: 10, y: 390 },
], 'handles the inner corner of an L-shaped room');

assert.deepEqual(getRoomInterior({ ...rectangle, walls: [] }), [], 'returns no interior without a closed outline');
