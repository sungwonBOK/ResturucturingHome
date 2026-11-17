import type { FurnitureItem } from '@restructuring-home/domain';
import { getFurnitureUse } from '../../furniture/catalog/getFurnitureCatalogItem';
import type { OutlinePoint } from '../../room-plan/model/roomOutline';
import { getFurnitureCenter, getFurnitureFront } from './furnitureClearance';
import { crossesFootprint, getFootprint } from '../../furniture/model/placementGeometry';

export function scoreFurnitureUse(furniture: FurnitureItem[]): number {
  const items = furniture.map((item) => {
    const { role, front } = getFurnitureUse(item);
    return { role, center: getFurnitureCenter(item), front: getFurnitureFront(item, front) };
  });
  const tvs = items.filter(({ role }) => role === 'tv_stand');
  const workSurfaces = items.filter(({ role }) => role === 'desk' || role === 'vanity' || role === 'dining_table');
  const sightObstacles = furniture.filter((item) => {
    const { role } = getFurnitureUse(item);
    return role === 'wardrobe' || role === 'bookshelf' || role === 'fridge';
  }).map(getFootprint);

  const viewing = items.filter(({ role }) => role === 'sofa').reduce((score, sofa) => score + Math.max(0, ...tvs.map((tv) => {
    if (sightObstacles.some((obstacle) => crossesFootprint(sofa.center, tv.center, obstacle))) return 0;
    const { direction } = directionBetween(sofa.center, tv.center);
    return facing(sofa.front, direction) * facing(tv.front, { x: -direction.x, y: -direction.y });
  })), 0);

  const seating = items.filter(({ role }) => role === 'chair').reduce((score, chair) => score + Math.max(0, ...workSurfaces.map((surface) => {
    const { direction, distance } = directionBetween(chair.center, surface.center);
    const chairFacesSurface = facing(chair.front, direction);
    const chairOnUsableSide = facing(surface.front, { x: -direction.x, y: -direction.y });
    return 0.5 * chairFacesSurface * chairOnUsableSide / (1 + distance / 100);
  })), 0);
  return viewing + seating;
}

function directionBetween(from: OutlinePoint, to: OutlinePoint) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  return { direction: { x: dx / (distance || 1), y: dy / (distance || 1) }, distance };
}

function facing(front: OutlinePoint | undefined, direction: OutlinePoint): number {
  return front ? Math.max(0, front.x * direction.x + front.y * direction.y) : 1;
}
