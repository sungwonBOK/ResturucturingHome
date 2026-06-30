import type { FurnitureItem, Opening, RoomFloorPlan, Wall } from '@restructuring-home/domain';

export interface FloorPlanCanvasGeometry {
  scale: number;
  offsetX: number;
  offsetY: number;
  walls: CanvasWall[];
  openings: CanvasOpening[];
  furniture: CanvasFurniture[];
}

export interface CanvasWall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
}

export interface CanvasOpening {
  id: string;
  variant: 'door' | 'window';
  x: number;
  y: number;
  width: number;
  isHorizontal: boolean;
}

export interface CanvasFurniture {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label: string;
}

export function getFloorPlanCanvasGeometry(
  plan: RoomFloorPlan,
  canvasWidth: number,
  canvasHeight: number,
): FloorPlanCanvasGeometry {
  const scale = Math.min(canvasWidth / plan.width, canvasHeight / plan.height);
  const fittedWidth = plan.width * scale;
  const fittedHeight = plan.height * scale;
  const offsetX = (canvasWidth - fittedWidth) / 2;
  const offsetY = (canvasHeight - fittedHeight) / 2;

  const toX = (value: number) => offsetX + value * scale;
  const toY = (value: number) => offsetY + value * scale;

  return {
    scale,
    offsetX,
    offsetY,
    walls: plan.walls.map((wall) => toCanvasWall(wall, scale, toX, toY)),
    openings: [
      ...plan.windows.map((opening) => toCanvasOpening(opening, 'window', plan, scale, toX, toY)),
      ...plan.doors.map((opening) => toCanvasOpening(opening, 'door', plan, scale, toX, toY)),
    ],
    furniture: plan.furniture.map((item) => toCanvasFurniture(item, scale, toX, toY)),
  };
}

function toCanvasWall(
  wall: Wall,
  scale: number,
  toX: (value: number) => number,
  toY: (value: number) => number,
): CanvasWall {
  return {
    id: wall.id,
    x1: toX(wall.x1),
    y1: toY(wall.y1),
    x2: toX(wall.x2),
    y2: toY(wall.y2),
    thickness: wall.thickness * scale,
  };
}

function toCanvasOpening(
  opening: Opening,
  variant: CanvasOpening['variant'],
  plan: RoomFloorPlan,
  scale: number,
  toX: (value: number) => number,
  toY: (value: number) => number,
): CanvasOpening {
  const wall = plan.walls.find((item) => item.id === opening.wallId);

  return {
    id: opening.id,
    variant,
    x: toX(opening.x),
    y: toY(opening.y),
    width: opening.width * scale,
    isHorizontal: wall ? wall.y1 === wall.y2 : true,
  };
}

function toCanvasFurniture(
  item: FurnitureItem,
  scale: number,
  toX: (value: number) => number,
  toY: (value: number) => number,
): CanvasFurniture {
  return {
    id: item.id,
    x: toX(item.x),
    y: toY(item.y),
    width: item.width * scale,
    height: item.height * scale,
    rotation: item.rotation,
    label: item.label ?? item.type,
  };
}
