import type { FurnitureItem, RoomFloorPlan } from '@restructuring-home/domain';
import { useRef, useState } from 'react';
import { useCanvasPanGesture } from '../../../components/FlowScrollGesture';
import type { SnapCandidate, SnapLocks } from '../../editor-snapping/magneticSnap';
import type { CanvasFurniture, FloorPlanCanvasGeometry } from '../../room-editor/floorPlanCanvasGeometry';
import {
  getAngleFromFurnitureCenter,
  getFurnitureInteractionAtPoint,
  toFurnitureLocalDelta,
  type CanvasPoint,
  type FurnitureCanvasInteraction,
} from '../model/furnitureCanvasInteraction';
import { moveFurniture, resizeFurniture, rotateFurniture } from '../model/furnitureEditing';
import { getNearbyWallAngles, snapFurniturePosition, snapFurnitureRotation } from '../model/furnitureSnapping';

interface ActiveGesture {
  kind: FurnitureCanvasInteraction['kind'];
  plan: RoomFloorPlan;
  /** 마지막으로 반영된 도면. 막혔을 때 이 상태에서 벽을 따라 미끄러집니다. */
  current: RoomFloorPlan;
  furniture: FurnitureItem;
  canvasFurniture: CanvasFurniture;
  startPoint: CanvasPoint;
  startAngle: number;
  scale: number;
  locks: SnapLocks;
  angleLock?: SnapCandidate;
  wallAngles: readonly number[];
}

interface FurnitureCanvasPanOptions {
  plan: RoomFloorPlan;
  geometry: FloorPlanCanvasGeometry;
  selectedFurnitureId?: string;
  onSelectFurniture: (id: string | undefined) => void;
  onPlanChange: (plan: RoomFloorPlan) => void;
}

export function useFurnitureCanvasPan({
  plan, geometry, selectedFurnitureId, onSelectFurniture, onPlanChange,
}: FurnitureCanvasPanOptions) {
  const activeGesture = useRef<ActiveGesture | undefined>(undefined);
  const [snapGuides, setSnapGuides] = useState<SnapLocks>({});
  const [snappedAngle, setSnappedAngle] = useState<number>();

  const pan = useCanvasPanGesture()
    .onBegin(({ x, y }) => {
      const interaction = getFurnitureInteractionAtPoint(geometry.furniture, selectedFurnitureId, x, y);
      onSelectFurniture(interaction?.furnitureId);
      if (!interaction) return;

      const furniture = plan.furniture.find((item) => item.id === interaction.furnitureId);
      const canvasFurniture = geometry.furniture.find((item) => item.id === interaction.furnitureId);
      if (!furniture || !canvasFurniture) return;

      const startPoint = { x, y };
      activeGesture.current = {
        kind: interaction.kind, plan, current: plan, furniture, canvasFurniture, startPoint,
        startAngle: getAngleFromFurnitureCenter(canvasFurniture, startPoint),
        scale: geometry.scale,
        locks: {},
        wallAngles: interaction.kind === 'rotate' ? getNearbyWallAngles(plan, furniture, geometry.scale) : [],
      };
    })
    .onUpdate(({ translationX: deltaX, translationY: deltaY }) => {
      const drag = activeGesture.current;
      if (!drag) return;

      const { furniture, scale } = drag;
      if (drag.kind === 'move') {
        const point = { x: furniture.x + deltaX / scale, y: furniture.y + deltaY / scale };
        const snapped = snapFurniturePosition(drag.plan, furniture, point, scale, drag.locks);
        const nextPlan = moveFurniture(drag.current, furniture.id, snapped.point.x, snapped.point.y);
        const placed = nextPlan.furniture.find((item) => item.id === furniture.id);
        drag.locks = {
          x: placed && Math.abs(placed.x - snapped.point.x) < 0.001 ? snapped.locks.x : undefined,
          y: placed && Math.abs(placed.y - snapped.point.y) < 0.001 ? snapped.locks.y : undefined,
        };
        setSnapGuides(drag.locks);
        drag.current = nextPlan;
        onPlanChange(nextPlan);
        return;
      }

      if (drag.kind === 'resize') {
        const local = toFurnitureLocalDelta(deltaX, deltaY, furniture.rotation);
        drag.current = resizeFurniture(drag.current, furniture.id, furniture.width + local.x / scale, furniture.height + local.y / scale);
        onPlanChange(drag.current);
        return;
      }

      const currentAngle = getAngleFromFurnitureCenter(drag.canvasFurniture, {
        x: drag.startPoint.x + deltaX, y: drag.startPoint.y + deltaY,
      });
      const rotation = furniture.rotation + currentAngle - drag.startAngle;
      const snapped = snapFurnitureRotation(rotation, drag.angleLock, drag.wallAngles);
      drag.angleLock = snapped.lock;
      setSnappedAngle(snapped.lock ? Math.round(((snapped.rotation % 360) + 360) % 360) % 360 : undefined);
      drag.current = rotateFurniture(drag.current, furniture.id, snapped.rotation);
      onPlanChange(drag.current);
    })
    .onFinalize(() => {
      activeGesture.current = undefined;
      setSnapGuides({});
      setSnappedAngle(undefined);
    });

  return { pan, snapGuides, snappedAngle };
}
