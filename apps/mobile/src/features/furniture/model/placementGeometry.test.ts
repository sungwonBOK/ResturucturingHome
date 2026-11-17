import { strict as assert } from 'node:assert';
import type { FurnitureItem } from '@restructuring-home/domain';
import { fitsRoom, footprintsOverlap, getFootprint } from './placementGeometry';

const room = [
  { x: 0, y: 0 }, { x: 300, y: 0 }, { x: 300, y: 300 }, { x: 200, y: 300 },
  { x: 200, y: 100 }, { x: 100, y: 100 }, { x: 100, y: 300 }, { x: 0, y: 300 },
];
const widths = room.map(() => 10);
const desk: FurnitureItem = { id: 'desk', type: 'desk', x: 20, y: 30, width: 70, height: 60, rotation: 0 };
assert.equal(fitsRoom(getFootprint(desk), room, widths), true);
assert.equal(fitsRoom(getFootprint({ ...desk, x: 0 }), room, widths), false, 'wall thickness consumes interior space');
assert.equal(fitsRoom(getFootprint({ ...desk, x: 75, y: 90, width: 150, height: 120 }), room, widths),
  false, 'a desk edge can cross a notch even if all its corners are inside the room');
assert.equal(footprintsOverlap(getFootprint(desk), getFootprint(desk)), true, 'identical rectangles overlap');
assert.equal(footprintsOverlap(getFootprint(desk), getFootprint({ ...desk, x: 90 })), false, 'touching edges are allowed');

const chaise: FurnitureItem = { id: 'sofa', type: 'sofa', catalogId: 'sofa-chaise-left', x: 0, y: 0, width: 240, height: 160, rotation: 0 };
const table: FurnitureItem = { id: 'table', type: 'dining_table', catalogId: 'dining-table-round', x: 145, y: 105, width: 40, height: 40, rotation: 90 };
assert.equal(footprintsOverlap(getFootprint(chaise), getFootprint(table)), false, 'the empty part of the chaise bounds is available');
assert.equal(footprintsOverlap(getFootprint(chaise), getFootprint({ ...table, x: 65 })), true);
