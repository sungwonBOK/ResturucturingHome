import { mockStudioFloorPlan } from '../../mocks/mockRoomFloorPlan';
import { getFloorPlanPreviewMetrics } from './floorPlanPreviewMetrics';

const metrics = getFloorPlanPreviewMetrics(mockStudioFloorPlan);

assertEqual(metrics.wallCount, 4, 'wall count');
assertEqual(metrics.openingCount, 2, 'opening count');
assertEqual(metrics.furnitureCount, 3, 'furniture count');
assertEqual(metrics.sizeLabel, '360 x 480 cm', 'size label');

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}
