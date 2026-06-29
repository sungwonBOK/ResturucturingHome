import type { RoomFloorPlan } from '@restructuring-home/domain';

export interface FloorPlanPreviewMetrics {
  wallCount: number;
  openingCount: number;
  furnitureCount: number;
  sizeLabel: string;
}

export function getFloorPlanPreviewMetrics(plan: RoomFloorPlan): FloorPlanPreviewMetrics {
  return {
    wallCount: plan.walls.length,
    openingCount: plan.doors.length + plan.windows.length,
    furnitureCount: plan.furniture.length,
    sizeLabel: `${plan.width} x ${plan.height} cm`,
  };
}
