import type { FurnitureItem } from '@restructuring-home/domain';
import { getFurnitureUse } from '../../furniture/catalog/getFurnitureCatalogItem';
import type { OutlinePoint } from '../../room-plan/model/roomOutline';
import { getFurnitureCenter, getFurnitureFront } from './furnitureClearance';
import { getFootprint } from '../../furniture/model/placementGeometry';

const maxSeatingGapCm = 45;
const minFacingAlignment = Math.SQRT1_2;

interface ChairPair {
  chairId: string;
  surfaceId: string;
}

export function findChairPairs(furniture: FurnitureItem[]): ChairPair[] {
  const surfaces = furniture.filter((item) => {
    const { role } = getFurnitureUse(item);
    return role === 'desk' || role === 'vanity' || role === 'dining_table';
  });

  return furniture.flatMap((chair) => {
    if (getFurnitureUse(chair).role !== 'chair') return [];
    const matches = surfaces.filter((surface) => canUseSurface(chair, surface));
    // A chair may be independent or equally suited to more than one surface.
    return matches.length === 1 ? [{ chairId: chair.id, surfaceId: matches[0].id }] : [];
  });
}

export function keepsChairPairs(furniture: FurnitureItem[], pairs: ChairPair[]): boolean {
  if (pairs.length === 0) return true;
  const byId = new Map(furniture.map((item) => [item.id, item]));
  return pairs.every(({ chairId, surfaceId }) => {
    const chair = byId.get(chairId);
    const surface = byId.get(surfaceId);
    return Boolean(chair && surface && canUseSurface(chair, surface));
  });
}

function canUseSurface(chair: FurnitureItem, surface: FurnitureItem): boolean {
  const chairCenter = getFurnitureCenter(chair);
  const surfaceCenter = getFurnitureCenter(surface);
  const dx = surfaceCenter.x - chairCenter.x;
  const dy = surfaceCenter.y - chairCenter.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return false;

  const towardSurface = { x: dx / distance, y: dy / distance };
  const towardChair = { x: -towardSurface.x, y: -towardSurface.y };
  const chairFront = getFurnitureFront(chair, getFurnitureUse(chair).front);
  const surfaceFront = getFurnitureFront(surface, getFurnitureUse(surface).front);
  if (chairFront && dot(chairFront, towardSurface) < minFacingAlignment) return false;
  if (surfaceFront && dot(surfaceFront, towardChair) < minFacingAlignment) return false;

  const chairFootprint = getFootprint(chair);
  const surfaceFootprint = getFootprint(surface);
  const gap = distance - extentToward(chairFootprint, chairCenter, towardSurface)
    - extentToward(surfaceFootprint, surfaceCenter, towardChair);
  return gap <= maxSeatingGapCm;
}

function extentToward(footprint: ReturnType<typeof getFootprint>, center: OutlinePoint, direction: OutlinePoint): number {
  if ('radius' in footprint) return footprint.radius;
  return Math.max(...footprint.vertices.map((vertex) => dot({ x: vertex.x - center.x, y: vertex.y - center.y }, direction)));
}

function dot(first: OutlinePoint, second: OutlinePoint): number {
  return first.x * second.x + first.y * second.y;
}
