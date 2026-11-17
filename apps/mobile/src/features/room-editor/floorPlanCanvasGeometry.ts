import type { FurnitureItem, Opening, RoomFloorPlan, Wall } from '@restructuring-home/domain';
import type { FurniturePreset } from '../furniture/catalog/furnitureCatalog';
import { getFurniturePreset } from '../furniture/catalog/getFurnitureCatalogItem';
import { getOpeningSegment } from '../room-plan/model/openingSegment';
import { getWallBounds } from '../room-plan/model/roomOutline';

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
  endX: number;
  endY: number;
}

export interface CanvasFurniture {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label: string;
  preset?: FurniturePreset;
}

export function getFloorPlanCanvasGeometry(
  plan: RoomFloorPlan,
  canvasWidth: number,
  canvasHeight: number,
): FloorPlanCanvasGeometry {
  const { scale, offsetX, offsetY, toX, toY } = getFloorPlanCanvasTransform(plan, canvasWidth, canvasHeight);

  return {
    scale,
    offsetX,
    offsetY,
    walls: plan.walls.map((wall) => toCanvasWall(wall, scale, toX, toY)),
    openings: [
      ...plan.windows.flatMap((opening) => toCanvasOpening(opening, 'window', plan, scale, toX, toY)),
      ...plan.doors.flatMap((opening) => toCanvasOpening(opening, 'door', plan, scale, toX, toY)),
    ],
    furniture: plan.furniture
      .map((item) => toCanvasFurniture(item, scale, toX, toY))
      .sort((first, second) =>
        Number(Boolean(second.preset?.allowsFurnitureOnTop)) - Number(Boolean(first.preset?.allowsFurnitureOnTop))),
  };
}

export function getFloorPlanCanvasTransform(plan: RoomFloorPlan, width: number, height: number, padding = 0) {
  const bounds = getWallBounds(plan.walls);
  const minX = Number.isFinite(bounds.minX) ? bounds.minX : 0;
  const minY = Number.isFinite(bounds.minY) ? bounds.minY : 0;
  const roomWidth = bounds.maxX > minX ? bounds.maxX - minX : Math.max(plan.width, 1);
  const roomHeight = bounds.maxY > minY ? bounds.maxY - minY : Math.max(plan.height, 1);
  const scale = Math.min(Math.max(1, width - padding * 2) / roomWidth, Math.max(1, height - padding * 2) / roomHeight);
  const offsetX = (width - roomWidth * scale) / 2 - minX * scale;
  const offsetY = (height - roomHeight * scale) / 2 - minY * scale;
  return { scale, offsetX, offsetY, toX: (x: number) => offsetX + x * scale, toY: (y: number) => offsetY + y * scale };
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
): CanvasOpening[] {
  const wall = plan.walls.find((item) => item.id === opening.wallId);
  const segment = wall && getOpeningSegment(opening, wall);
  if (!segment) return [];

  return [{
    id: opening.id,
    variant,
    x: toX(segment.start.x),
    y: toY(segment.start.y),
    width: segment.width * scale,
    endX: toX(segment.end.x),
    endY: toY(segment.end.y),
  }];
}

function toCanvasFurniture(
  item: FurnitureItem,
  scale: number,
  toX: (value: number) => number,
  toY: (value: number) => number,
): CanvasFurniture {
  const preset = getFurniturePreset(item.type, item.catalogId);
  return {
    id: item.id,
    x: toX(item.x),
    y: toY(item.y),
    width: item.width * scale,
    height: item.height * scale,
    rotation: item.rotation,
    label: item.label ?? preset.label,
    preset,
  };
}
