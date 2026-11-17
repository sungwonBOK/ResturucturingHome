import { strict as assert } from 'node:assert';
import { getNearbyWallAngles, snapFurniturePosition, snapFurnitureRotation } from '../furniture/model/furnitureSnapping';
import { snapRoomVertex } from '../room-plan/model/roomVertexSnapping';
import type { FurnitureItem, RoomFloorPlan } from '@restructuring-home/domain';

const desk: FurnitureItem = { id: 'desk', type: 'desk', x: 100, y: 100, width: 60, height: 40, rotation: 0 };
const room: RoomFloorPlan = {
  width: 400,
  height: 300,
  walls: [
    { id: 'top', x1: 0, y1: 0, x2: 400, y2: 0, thickness: 10 },
    { id: 'right', x1: 400, y1: 0, x2: 400, y2: 300, thickness: 10 },
    { id: 'bottom', x1: 400, y1: 300, x2: 0, y2: 300, thickness: 10 },
    { id: 'left', x1: 0, y1: 300, x2: 0, y2: 0, thickness: 10 },
  ],
  doors: [],
  windows: [],
  furniture: [desk, { ...desk, id: 'other', x: 220, y: 160 }],
};

const vertex = snapRoomVertex(room, 1, { x: 395, y: 6 }, 1, {});
assert.deepEqual(vertex.point, { x: 400, y: 0 });
assert.deepEqual(snapRoomVertex(room, 1, { x: 389, y: 11 }, 1, vertex.locks).point, { x: 400, y: 0 });
assert.deepEqual(snapRoomVertex(room, 1, { x: 385, y: 15 }, 1, vertex.locks).point, { x: 385, y: 15 });

const aligned = snapFurniturePosition(room, desk, { x: 155, y: 157 }, 1, {});
assert.deepEqual(aligned.point, { x: 160, y: 160 });
assert.equal(aligned.locks.x?.guide, 220);
assert.equal(aligned.locks.y?.guide, 180);
assert.equal(snapFurniturePosition(room, desk, { x: 150, y: 157 }, 1, aligned.locks).point.x, 160);
assert.equal(snapFurniturePosition(room, desk, { x: 146, y: 157 }, 1, aligned.locks).point.x, 146);

const againstWall = snapFurniturePosition(room, desk, { x: 9, y: 70 }, 1, {});
assert.equal(againstWall.point.x, 5, 'furniture aligns to the inner face of a 10 cm wall');

const angle = snapFurnitureRotation(87);
assert.equal(angle.rotation, 90);
assert.equal(snapFurnitureRotation(98, angle.lock).rotation, 90);
assert.equal(snapFurnitureRotation(100, angle.lock).rotation, 100);
assert.equal(snapFurnitureRotation(-3).rotation, 0);
assert.equal(snapFurnitureRotation(-8, snapFurnitureRotation(358).lock).rotation, 0);
assert.equal(snapFurnitureRotation(132).rotation, 132);

const diagonal = {
  ...room,
  furniture: [desk],
  walls: [{ id: 'diagonal', x1: 0, y1: 0, x2: 300, y2: 300, thickness: 10 }],
};
const wallAngles = getNearbyWallAngles(diagonal, desk, 1);
assert.deepEqual(wallAngles, [45]);
assert.equal(snapFurnitureRotation(42, undefined, wallAngles).rotation, 45);
assert.equal(snapFurnitureRotation(35, snapFurnitureRotation(42, undefined, wallAngles).lock, wallAngles).rotation, 35);
assert.deepEqual(getNearbyWallAngles(diagonal, { ...desk, x: 280, y: 30 }, 1), []);
assert.deepEqual(snapFurniturePosition(diagonal, desk, { x: 97, y: 105 }, 1, {}).point, { x: 97, y: 105 });
