import { strict as assert } from 'node:assert';
import type { RoomFloorPlan } from '@restructuring-home/domain';
import { getOpeningSegment } from './openingSegment';
import {
  addOpening,
  findPlanTarget,
  getOpeningRange,
  moveOpening,
  removeOpening,
  setOpeningWidth,
} from './openingEditing';

const plan: RoomFloorPlan = {
  width: 400,
  height: 300,
  walls: [
    { id: 'north', x1: 0, y1: 0, x2: 400, y2: 0, thickness: 10 },
    { id: 'east', x1: 400, y1: 0, x2: 400, y2: 300, thickness: 10 },
    { id: 'south', x1: 400, y1: 300, x2: 0, y2: 300, thickness: 10 },
    { id: 'west', x1: 0, y1: 300, x2: 0, y2: 0, thickness: 10 },
  ],
  doors: [],
  windows: [],
  furniture: [],
};

// 추가: 벽 가운데에 기본 폭으로 놓인다. 시작점 표현은 기존 getOpeningSegment 규칙을 따른다.
const withDoor = addOpening(plan, 'door', 'north');
const door = withDoor.doors[0];
assert.equal(door.width, 90, 'default door width');
assert.deepEqual(getOpeningRange(withDoor, door.id), { start: 155, end: 245 }, 'door is centered on the wall');

const onSouth = addOpening(plan, 'window', 'south');
const southWindow = onSouth.windows[0];
const segment = getOpeningSegment(southWindow, onSouth.walls[2])!;
assert.deepEqual([segment.start.x, segment.end.x].sort((a, b) => a - b), [140, 260], 'reversed wall keeps the drawn span');
assert.deepEqual(getOpeningRange(onSouth, southWindow.id), { start: 140, end: 260 }, 'range is measured from the wall start');

// 같은 벽에 하나 더 추가하면 빈 자리를 찾는다.
const twoOpenings = addOpening(withDoor, 'window', 'north');
const range = getOpeningRange(twoOpenings, twoOpenings.windows[0].id)!;
assert.ok(range.end <= 155 || range.start >= 245, 'second opening does not overlap the first');
assert.notEqual(twoOpenings.windows[0].id, door.id, 'opening ids are unique');

const shortWall = { ...plan, walls: plan.walls.map((wall) => (wall.id === 'east' ? { ...wall, y2: 30 } : wall)) };
assert.throws(() => addOpening(shortWall, 'door', 'east'), /자리가 부족/, 'rejects a wall that is too short');

// 이동: 벽 끝과 다른 문·창을 넘어가지 않는다.
assert.deepEqual(getOpeningRange(moveOpening(withDoor, door.id, -50), door.id), { start: 0, end: 90 }, 'clamps to the wall start');
assert.deepEqual(getOpeningRange(moveOpening(withDoor, door.id, 999), door.id), { start: 310, end: 400 }, 'clamps to the wall end');
const blockedWindow = twoOpenings.windows[0];
const blockedRange = getOpeningRange(twoOpenings, blockedWindow.id)!;
const pushed = getOpeningRange(moveOpening(twoOpenings, blockedWindow.id, blockedRange.start < 155 ? 200 : 100), blockedWindow.id)!;
assert.ok(pushed.end <= 155 || pushed.start >= 245, 'stops before the neighbouring opening');

// 폭 변경: 들어갈 수 있으면 반영, 끝에 닿으면 안쪽으로 밀고, 안 되면 오류.
assert.equal(setOpeningWidth(withDoor, door.id, 120).doors[0].width, 120, 'widens in place');
const nearEnd = moveOpening(withDoor, door.id, 999);
assert.deepEqual(getOpeningRange(setOpeningWidth(nearEnd, door.id, 150), door.id), { start: 250, end: 400 }, 'shifts inward to fit');
assert.throws(() => setOpeningWidth(withDoor, door.id, 500), /들어가지 않아요/, 'rejects a width wider than the wall');
assert.throws(() => setOpeningWidth(withDoor, door.id, 10), /이상/, 'rejects a width below the minimum');

assert.equal(removeOpening(withDoor, door.id).doors.length, 0, 'removes the opening');

// 화면 터치 대상 찾기: 문·창이 벽보다 우선이다.
assert.deepEqual(findPlanTarget(withDoor, { x: 200, y: 3 }, 12), { kind: 'opening', id: door.id }, 'touching a door selects it');
assert.deepEqual(findPlanTarget(withDoor, { x: 50, y: 4 }, 12), { kind: 'wall', id: 'north' }, 'touching a bare wall selects the wall');
assert.equal(findPlanTarget(withDoor, { x: 200, y: 150 }, 12), undefined, 'the middle of the room selects nothing');
