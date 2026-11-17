import type { RoomFloorPlan } from '@restructuring-home/domain';
import {
  addFurniture,
  createFurnitureId,
  moveFurniture,
  resizeFurniture,
  rotateFurniture,
} from './furnitureEditing';

const emptyPlan: RoomFloorPlan = {
  width: 360,
  height: 480,
  walls: [],
  doors: [],
  windows: [],
  furniture: [],
};

const sofaPlan = addFurniture(emptyPlan, 'sofa', 'sofa-1');
const sofa = sofaPlan.furniture[0];

assertEqual(sofaPlan.furniture.length, 1, 'added furniture count');
assertEqual(sofa.type, 'sofa', 'added furniture type');
assertEqual(sofa.width, 200, 'sofa default width');
assertEqual(sofa.height, 90, 'sofa default height');
assertEqual(sofa.x, 80, 'sofa is centered horizontally');
assertEqual(sofa.y, 195, 'sofa is centered vertically');
assertEqual(createFurnitureId(sofaPlan.furniture, 'sofa'), 'sofa-2', 'next furniture id');

const movedPlan = moveFurniture(sofaPlan, 'sofa-1', 999, -20);
const movedSofa = getFurniture(movedPlan, 'sofa-1');

assertEqual(movedSofa.x, 160, 'move clamps to room right edge');
assertEqual(movedSofa.y, 0, 'move clamps to room top edge');

const resizedPlan = resizeFurniture(movedPlan, 'sofa-1', 1, 999);
const resizedSofa = getFurniture(resizedPlan, 'sofa-1');

assertEqual(resizedSofa.width, 30, 'resize keeps minimum width');
assertEqual(resizedSofa.height, 480, 'resize clamps to room bottom edge');

const rotatedPlan = rotateFurniture(sofaPlan, 'sofa-1', -90);
assertEqual(getFurniture(rotatedPlan, 'sofa-1').rotation, 270, 'rotation normalizes negative degrees');
assertEqual(rotateFurniture(rotatedPlan, 'sofa-1', 450).furniture[0].rotation, 90, 'rotation normalizes overflow degrees');

const edgePlan: RoomFloorPlan = {
  ...emptyPlan,
  furniture: [{ id: 'bookshelf-1', type: 'bookshelf', x: 300, y: 100, width: 50, height: 150, rotation: 0 }],
};
const edgeRotation = getFurniture(rotateFurniture(edgePlan, 'bookshelf-1', 90), 'bookshelf-1');

assertEqual(edgeRotation.x, 260, 'rotation keeps the visual furniture bounds inside the room');

const resizedRotation = getFurniture(resizeFurniture({ ...edgePlan, furniture: [edgeRotation] }, 'bookshelf-1', 50, 400), 'bookshelf-1');

assertEqual(resizedRotation.height, 360, 'resize keeps rotated furniture bounds inside the room');

function getFurniture(plan: RoomFloorPlan, id: string) {
  const furniture = plan.furniture.find((item) => item.id === id);

  if (!furniture) {
    throw new Error(`Missing furniture: ${id}`);
  }

  return furniture;
}

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}
