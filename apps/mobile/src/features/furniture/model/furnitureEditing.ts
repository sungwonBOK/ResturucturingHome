import type { FurnitureItem, FurnitureType, RoomFloorPlan } from '@restructuring-home/domain';
import { getFurnitureCatalogItem, getFurniturePreset } from '../catalog/getFurnitureCatalogItem';
import { createRoomFit, type RoomBounds, type RoomFit } from './roomFit';

export const MIN_FURNITURE_SIZE_CM = 30;

export function createFurnitureId(furniture: readonly FurnitureItem[], type: FurnitureType): string {
  let number = 1;
  let id = `${type}-${number}`;
  const existingIds = new Set(furniture.map((item) => item.id));

  while (existingIds.has(id)) {
    number += 1;
    id = `${type}-${number}`;
  }

  return id;
}

export function addFurniture(plan: RoomFloorPlan, type: FurnitureType, id: string, catalogId?: string): RoomFloorPlan {
  if (plan.furniture.some((item) => item.id === id)) {
    throw new Error(`Furniture id already exists: ${id}`);
  }

  const bounds = createRoomFit(plan).interiorBounds;
  const roomWidth = bounds.maxX - bounds.minX;
  const roomHeight = bounds.maxY - bounds.minY;
  const catalogItem = catalogId ? getFurniturePreset(type, catalogId) : getFurnitureCatalogItem(type);
  const limit = catalogItem.outline.kind === 'circle' ? Math.min(roomWidth, roomHeight) : Infinity;
  const width = Math.min(catalogItem.width, roomWidth, limit);
  const height = Math.min(catalogItem.height, roomHeight, limit);
  const furniture: FurnitureItem = {
    id,
    type,
    label: catalogItem.label,
    ...(catalogId ? { catalogId: catalogItem.id } : {}),
    width,
    height,
    x: bounds.minX + (roomWidth - width) / 2,
    y: bounds.minY + (roomHeight - height) / 2,
    rotation: 0,
  };

  return { ...plan, furniture: [...plan.furniture, furniture] };
}

export function moveFurniture(plan: RoomFloorPlan, id: string, x: number, y: number): RoomFloorPlan {
  return updateFurniture(plan, id, (item, fit) => placeInRoom(fit, item, { ...item, x, y }));
}

export function resizeFurniture(plan: RoomFloorPlan, id: string, width: number, height: number): RoomFloorPlan {
  return updateFurniture(plan, id, (item, fit) => {
    const bounds = fit.interiorBounds;
    if (isCircular(item)) {
      const diameter = Math.abs(width - item.width) >= Math.abs(height - item.height) ? width : height;
      const size = clampSize(diameter, Math.min(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY));
      return placeInRoom(fit, item, { ...item, width: size, height: size });
    }

    const resizedItem = fitFurnitureSizeInRoom(bounds, {
      ...item,
      width: clampSize(width, bounds.maxX - item.x),
      height: clampSize(height, bounds.maxY - item.y),
    });

    return placeInRoom(fit, item, resizedItem);
  });
}

export function setFurnitureDimensions(
  plan: RoomFloorPlan, id: string, width: number, height: number, label?: string,
): RoomFloorPlan {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('치수는 0보다 큰 숫자로 입력해 주세요.');
  }

  return updateFurniture(plan, id, (item, fit) => {
    const nextItem = { ...item, width, height: isCircular(item) ? width : height };
    const rotated = getRotatedDimensions(nextItem);
    const bounds = fit.interiorBounds;
    if (rotated.width - (bounds.maxX - bounds.minX) > 0.001 || rotated.height - (bounds.maxY - bounds.minY) > 0.001) {
      throw new Error('현재 방향에서 가구가 방의 가로·세로 범위를 벗어나요.');
    }

    const placed = placeInRoom(fit, item, nextItem);
    if (placed.width !== nextItem.width || placed.height !== nextItem.height) {
      throw new Error('이 크기로는 현재 자리에서 방 안에 들어가지 않아요. 가구를 옮긴 뒤 다시 적용해 주세요.');
    }

    return { ...placed, label: label?.trim() || item.label };
  });
}

export function rotateFurniture(plan: RoomFloorPlan, id: string, rotation: number): RoomFloorPlan {
  return updateFurniture(plan, id, (item, fit) => placeInRoom(fit, item, { ...item, rotation: normalizeRotation(rotation) }));
}

function updateFurniture(
  plan: RoomFloorPlan, id: string, update: (item: FurnitureItem, fit: RoomFit) => FurnitureItem,
): RoomFloorPlan {
  if (!plan.furniture.some((item) => item.id === id)) {
    return plan;
  }

  const fit = createRoomFit(plan);
  return { ...plan, furniture: plan.furniture.map((item) => (item.id === id ? update(item, fit) : item)) };
}

/**
 * 바뀐 가구(candidate)를 방 안에 놓습니다.
 * 1) 벽 안쪽 사각형으로 먼저 제한하고, 2) 실제 방 모양에 들어가지 않으면
 * 한 축만 움직여 벽을 따라 미끄러지게 하고, 3) 그래도 안 되면 직전 상태를 유지합니다.
 * 이미 방 밖에 있던 가구는 사용자가 다시 끌어올 수 있도록 자유롭게 움직입니다.
 */
function placeInRoom(fit: RoomFit, previous: FurnitureItem, candidate: FurnitureItem): FurnitureItem {
  const clamped = clampToBounds(fit.interiorBounds, candidate);
  if (!fit.fits(previous)) return clamped;

  const options = [
    clamped,
    clampToBounds(fit.interiorBounds, { ...candidate, y: previous.y }),
    clampToBounds(fit.interiorBounds, { ...candidate, x: previous.x }),
  ];
  return options.find((option) => fit.fits(option)) ?? previous;
}

function clampSize(value: number, maximum: number): number {
  return clamp(value, Math.min(MIN_FURNITURE_SIZE_CM, maximum), maximum);
}

function normalizeRotation(rotation: number): number {
  return ((rotation % 360) + 360) % 360;
}

function clampToBounds(bounds: RoomBounds, item: FurnitureItem): FurnitureItem {
  const rotated = getRotatedDimensions(item);
  const centerX = clampCenter(item.x + item.width / 2, rotated.width / 2, bounds.minX, bounds.maxX);
  const centerY = clampCenter(item.y + item.height / 2, rotated.height / 2, bounds.minY, bounds.maxY);

  return { ...item, x: centerX - item.width / 2, y: centerY - item.height / 2 };
}

function fitFurnitureSizeInRoom(bounds: RoomBounds, item: FurnitureItem): FurnitureItem {
  const rotated = getRotatedDimensions(item);
  const scale = Math.min(1, (bounds.maxX - bounds.minX) / rotated.width, (bounds.maxY - bounds.minY) / rotated.height);

  return { ...item, width: item.width * scale, height: item.height * scale };
}

function isCircular(item: FurnitureItem): boolean {
  return getFurniturePreset(item.type, item.catalogId).outline.kind === 'circle';
}

function getRotatedDimensions(item: FurnitureItem) {
  if (isCircular(item)) {
    return { width: item.width, height: item.height };
  }

  const radians = (item.rotation * Math.PI) / 180;
  const cosine = Math.abs(Math.cos(radians));
  const sine = Math.abs(Math.sin(radians));
  return { width: cosine * item.width + sine * item.height, height: sine * item.width + cosine * item.height };
}

function clampCenter(value: number, radius: number, minimum: number, maximum: number): number {
  return radius * 2 >= maximum - minimum ? (minimum + maximum) / 2 : clamp(value, minimum + radius, maximum - radius);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
