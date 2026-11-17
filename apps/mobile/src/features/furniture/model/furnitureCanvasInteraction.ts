import type { CanvasFurniture } from '../../room-editor/floorPlanCanvasGeometry';

export interface CanvasPoint { x: number; y: number; }
export interface FurnitureHandlePoints { resize: CanvasPoint; rotation: CanvasPoint; }
export type FurnitureCanvasInteraction = { kind: 'move'; furnitureId: string } | { kind: 'resize'; furnitureId: string } | { kind: 'rotate'; furnitureId: string };

const HANDLE_HIT_RADIUS = 18;
const ROTATION_HANDLE_OFFSET = 30;

export function getFurnitureHandlePoints(furniture: CanvasFurniture): FurnitureHandlePoints {
  const center = getFurnitureCenter(furniture);
  return {
    resize: rotatePoint(center, { x: furniture.x + furniture.width, y: furniture.y + furniture.height }, furniture.rotation),
    rotation: rotatePoint(center, { x: center.x, y: furniture.y - ROTATION_HANDLE_OFFSET }, furniture.rotation),
  };
}

export function getFurnitureInteractionAtPoint(furniture: readonly CanvasFurniture[], selectedFurnitureId: string | undefined, x: number, y: number): FurnitureCanvasInteraction | undefined {
  const point = { x, y };
  const selectedFurniture = furniture.find((item) => item.id === selectedFurnitureId);

  if (selectedFurniture) {
    const handles = getFurnitureHandlePoints(selectedFurniture);
    if (isNear(point, handles.resize)) return { kind: 'resize', furnitureId: selectedFurniture.id };
    if (isNear(point, handles.rotation)) return { kind: 'rotate', furnitureId: selectedFurniture.id };
  }

  const touchedFurniture = [...furniture].reverse().find((item) => isPointInFurniture(point, item));
  return touchedFurniture ? { kind: 'move', furnitureId: touchedFurniture.id } : undefined;
}

export function toFurnitureLocalDelta(deltaX: number, deltaY: number, rotation: number): CanvasPoint {
  const radians = (rotation * Math.PI) / 180;
  return { x: Math.cos(radians) * deltaX + Math.sin(radians) * deltaY, y: -Math.sin(radians) * deltaX + Math.cos(radians) * deltaY };
}

export function getAngleFromFurnitureCenter(furniture: CanvasFurniture, point: CanvasPoint): number {
  const center = getFurnitureCenter(furniture);
  return (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI;
}

function isNear(first: CanvasPoint, second: CanvasPoint): boolean { return Math.hypot(first.x - second.x, first.y - second.y) <= HANDLE_HIT_RADIUS; }
function isPointInFurniture(point: CanvasPoint, furniture: CanvasFurniture): boolean {
  const center = getFurnitureCenter(furniture);
  const local = toFurnitureLocalDelta(point.x - center.x, point.y - center.y, furniture.rotation);
  const x = local.x / furniture.width + 0.5;
  const y = local.y / furniture.height + 0.5;
  const outline = furniture.preset?.outline;
  if (outline?.kind === 'circle') {
    return Math.hypot(x - 0.5, y - 0.5) <= 0.5;
  }
  if (outline?.kind === 'polygon') {
    let inside = false;
    let previous = outline.points[outline.points.length - 1];
    for (const current of outline.points) {
      if ((previous.y > y) !== (current.y > y)) {
        const intersection = previous.x + ((y - previous.y) * (current.x - previous.x)) / (current.y - previous.y);
        if (x < intersection) inside = !inside;
      }
      previous = current;
    }
    return inside;
  }
  return x >= 0 && x <= 1 && y >= 0 && y <= 1;
}
function getFurnitureCenter(furniture: CanvasFurniture): CanvasPoint { return { x: furniture.x + furniture.width / 2, y: furniture.y + furniture.height / 2 }; }
function rotatePoint(center: CanvasPoint, point: CanvasPoint, rotation: number): CanvasPoint {
  const radians = (rotation * Math.PI) / 180;
  const relativeX = point.x - center.x;
  const relativeY = point.y - center.y;
  return { x: center.x + relativeX * Math.cos(radians) - relativeY * Math.sin(radians), y: center.y + relativeX * Math.sin(radians) + relativeY * Math.cos(radians) };
}
