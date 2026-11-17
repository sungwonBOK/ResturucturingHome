import type { CanvasFurniture } from '../../room-editor/floorPlanCanvasGeometry';
import {
  getFurnitureHandlePoints,
  getFurnitureInteractionAtPoint,
  toFurnitureLocalDelta,
} from './furnitureCanvasInteraction';

const furniture: CanvasFurniture = {
  id: 'sofa-1',
  x: 100,
  y: 100,
  width: 80,
  height: 40,
  rotation: 90,
  label: '소파',
};

const handles = getFurnitureHandlePoints(furniture);

assertClose(handles.resize.x, 120, 'rotated resize handle x');
assertClose(handles.resize.y, 160, 'rotated resize handle y');
assertClose(handles.rotation.x, 190, 'rotated rotation handle x');
assertClose(handles.rotation.y, 120, 'rotated rotation handle y');
assertEqual(getFurnitureInteractionAtPoint([furniture], 'sofa-1', handles.resize.x, handles.resize.y)?.kind, 'resize', 'resize handle interaction');
assertEqual(getFurnitureInteractionAtPoint([furniture], 'sofa-1', handles.rotation.x, handles.rotation.y)?.kind, 'rotate', 'rotation handle interaction');
assertEqual(getFurnitureInteractionAtPoint([furniture], undefined, 140, 120)?.kind, 'move', 'furniture body interaction');

const localDelta = toFurnitureLocalDelta(10, 0, 90);
assertClose(localDelta.x, 0, 'local delta x');
assertClose(localDelta.y, -10, 'local delta y');

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

function assertClose(actual: number, expected: number, label: string) {
  if (Math.abs(actual - expected) > 0.001) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}
