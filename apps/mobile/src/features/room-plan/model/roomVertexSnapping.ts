import type { RoomFloorPlan } from '@restructuring-home/domain';
import { getMagneticSnap, SNAP_CAPTURE_DISTANCE, SNAP_RELEASE_DISTANCE, type SnapLocks } from '../../editor-snapping/magneticSnap';
import { getOutlineVertices, type OutlinePoint } from './roomOutline';

export function snapRoomVertex(
  plan: RoomFloorPlan,
  vertexIndex: number,
  rawPoint: OutlinePoint,
  scale: number,
  locks: SnapLocks,
) {
  const vertices = getOutlineVertices(plan);
  const previousIndex = (vertexIndex + vertices.length - 1) % vertices.length;
  const nextIndex = (vertexIndex + 1) % vertices.length;
  const referenceVertices = [vertices[previousIndex], vertices[nextIndex], ...vertices.filter(
    (_, index) => index !== vertexIndex && index !== previousIndex && index !== nextIndex,
  )].filter(Boolean);
  const capture = SNAP_CAPTURE_DISTANCE / scale;
  const release = SNAP_RELEASE_DISTANCE / scale;
  const x = getMagneticSnap(rawPoint.x, referenceVertices.map(({ x }) => ({ value: x, guide: x })), locks.x, capture, release);
  const y = getMagneticSnap(rawPoint.y, referenceVertices.map(({ y }) => ({ value: y, guide: y })), locks.y, capture, release);

  return { point: { x: x?.value ?? rawPoint.x, y: y?.value ?? rawPoint.y }, locks: { x, y } };
}
