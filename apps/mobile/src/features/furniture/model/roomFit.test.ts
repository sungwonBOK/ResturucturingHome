import { strict as assert } from 'node:assert';
import type { FurnitureItem, RoomFloorPlan } from '@restructuring-home/domain';
import { createRoomFit, findFurnitureOutsideRoom } from './roomFit';

const corners = [[0, 0], [300, 0], [300, 200], [150, 200], [150, 400], [0, 400]];
const lShape: RoomFloorPlan = {
  width: 300,
  height: 400,
  walls: corners.map(([x1, y1], index) => {
    const [x2, y2] = corners[(index + 1) % corners.length];
    return { id: `w${index}`, x1, y1, x2, y2, thickness: 10 };
  }),
  doors: [],
  windows: [],
  furniture: [],
};
const desk: FurnitureItem = { id: 'desk-1', type: 'desk', label: '책상', x: 20, y: 20, width: 100, height: 60, rotation: 0 };

const fit = createRoomFit(lShape);
assert.equal(fit.fits(desk), true, 'inside the interior');
assert.equal(fit.fits({ ...desk, x: 0 }), false, 'overlapping the wall thickness is outside');
assert.equal(fit.fits({ ...desk, x: 5 }), true, 'touching the inner face is inside');
assert.equal(fit.fits({ ...desk, x: 180, y: 250 }), false, 'the empty notch of an L-shaped room is outside');
assert.equal(fit.interiorBounds.minX, 5, 'interior bounds start at the inner face');
assert.equal(fit.interiorBounds.maxY, 395, 'interior bounds end at the inner face');

const outside = findFurnitureOutsideRoom({ ...lShape, furniture: [desk, { ...desk, id: 'desk-2', x: 180, y: 250 }] });
assert.deepEqual(outside.map(({ id }) => id), ['desk-2'], 'lists only furniture outside the room');

const noWalls = createRoomFit({ ...lShape, walls: [] });
assert.equal(noWalls.fits({ ...desk, x: 0, y: 0 }), true, 'falls back to the plan rectangle without walls');
assert.equal(noWalls.fits({ ...desk, x: 250 }), false, 'fallback rectangle still limits furniture');
