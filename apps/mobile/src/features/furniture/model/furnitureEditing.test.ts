import { strict as assert } from 'node:assert';
import type { FurnitureItem, RoomFloorPlan } from '@restructuring-home/domain';
import { addFurniture, moveFurniture, resizeFurniture, rotateFurniture, setFurnitureDimensions } from './furnitureEditing';

const corners = [[0, 0], [300, 0], [300, 200], [150, 200], [150, 400], [0, 400]];
const desk: FurnitureItem = { id: 'desk-1', type: 'desk', x: 20, y: 20, width: 100, height: 60, rotation: 0 };
const lShape: RoomFloorPlan = {
  width: 300,
  height: 400,
  walls: corners.map(([x1, y1], index) => {
    const [x2, y2] = corners[(index + 1) % corners.length];
    return { id: `w${index}`, x1, y1, x2, y2, thickness: 10 };
  }),
  doors: [],
  windows: [],
  furniture: [desk],
};

const pushedIntoWall = moveFurniture(lShape, 'desk-1', -40, 20).furniture[0];
assert.equal(pushedIntoWall.x, 5, 'stops at the inner face instead of the wall centerline');

const slid = moveFurniture(lShape, 'desk-1', 30, -50).furniture[0];
assert.deepEqual([slid.x, slid.y], [30, 5], 'slides along the wall while blocked on one axis');

const nearNotch = { ...lShape, furniture: [{ ...desk, x: 20, y: 120 }] };
const intoNotch = moveFurniture(nearNotch, 'desk-1', 120, 220).furniture[0];
assert.deepEqual([intoNotch.x, intoNotch.y], [120, 120], 'slides sideways instead of entering the empty notch');

const wide = { ...desk, x: 60, y: 130, width: 200 };
const blocked = moveFurniture({ ...lShape, furniture: [wide] }, 'desk-1', 60, 250).furniture[0];
assert.deepEqual([blocked.x, blocked.y], [60, 130], 'keeps the last valid position when no axis fits');

const stray = { ...lShape, furniture: [{ ...desk, x: 180, y: 250 }] };
const rescued = moveFurniture(stray, 'desk-1', 40, 250).furniture[0];
assert.deepEqual([rescued.x, rescued.y], [40, 250], 'furniture already outside can move freely back in');

const wardrobe: FurnitureItem = { id: 'wardrobe-1', type: 'wardrobe', x: 130, y: 130, width: 160, height: 60, rotation: 0 };
const notRotated = rotateFurniture({ ...lShape, furniture: [wardrobe] }, 'wardrobe-1', 90).furniture[0];
assert.equal(notRotated.rotation, 0, 'rejects a rotation that would reach into the empty notch');

const notResized = resizeFurniture(lShape, 'desk-1', 280, 300).furniture[0];
assert.equal(createFitsFlag(lShape, notResized), true, 'resize never leaves the room interior');

assert.throws(
  () => setFurnitureDimensions({ ...lShape, furniture: [{ ...desk, x: 20, y: 250 }] }, 'desk-1', 200, 60),
  /방 안에 들어가지 않아요/,
  'rejects dimensions that do not fit at the current location',
);

const added = addFurniture({ ...lShape, furniture: [] }, 'desk', 'desk-2').furniture[0];
assert.equal(added.x >= 5 && added.y >= 5, true, 'new furniture starts inside the interior bounds');

function createFitsFlag(plan: RoomFloorPlan, item: FurnitureItem) {
  return item.x >= 5 && item.y >= 5 && item.x + item.width <= 295 && item.y + item.height <= 195;
}
