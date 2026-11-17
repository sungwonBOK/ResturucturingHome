import type { FurnitureDetailFinish } from '../furnitureMaterials';
import type { FurnitureDetail, FurnitureOutline } from '../furniturePreset';

export const rectangle = { kind: 'rectangle' } as const;
export const circle = { kind: 'circle' } as const;

// 치수가 바뀌면 외곽선과 내부 요소가 함께 늘어나도록 0~1 비율 좌표를 사용합니다.
export const detail = (x: number, y: number, width: number, height: number, finish: FurnitureDetailFinish = 'cushion', shape?: 'oval'): FurnitureDetail =>
  ({ x, y, width, height, finish, shape });

export function cornerOutline(side: 'left' | 'right', armWidth: number, backDepth: number): FurnitureOutline {
  const points = [
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: backDepth },
    { x: armWidth, y: backDepth }, { x: armWidth, y: 1 }, { x: 0, y: 1 },
  ];
  return { kind: 'polygon', points: side === 'left' ? points : points.map(({ x, y }) => ({ x: 1 - x, y })) };
}
