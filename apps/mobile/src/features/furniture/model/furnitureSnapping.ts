import type { FurnitureItem, RoomFloorPlan } from '@restructuring-home/domain';
import {
  getMagneticSnap,
  SNAP_CAPTURE_DISTANCE,
  SNAP_RELEASE_DISTANCE,
  type SnapCandidate,
  type SnapLocks,
} from '../../editor-snapping/magneticSnap';
import { getFurniturePreset } from '../catalog/getFurnitureCatalogItem';

interface Point {
  x: number;
  y: number;
}

export function snapFurniturePosition(
  plan: RoomFloorPlan,
  item: FurnitureItem,
  rawPoint: Point,
  scale: number,
  locks: SnapLocks,
) {
  const box = getFurnitureOffsets(item);
  const candidates = { x: [] as SnapCandidate[], y: [] as SnapCandidate[] };
  const roomArea = plan.walls.reduce((area, wall) => area + wall.x1 * wall.y2 - wall.x2 * wall.y1, 0);
  const winding = Math.sign(roomArea);

  for (const wall of plan.walls) {
    const dx = wall.x2 - wall.x1;
    const dy = wall.y2 - wall.y1;
    // 벽 중심선에서 두께의 절반만큼 방 안쪽으로 이동한 면에 맞춥니다.
    if (dx === 0 && overlaps(rawPoint.y + box.y[0], rawPoint.y + box.y[2], wall.y1, wall.y2)) {
      const interior = -Math.sign(dy) * winding;
      const face = wall.x1 + interior * wall.thickness / 2;
      candidates.x.push({ value: face - box.x[interior < 0 ? 2 : 0], guide: face });
    } else if (dy === 0 && overlaps(rawPoint.x + box.x[0], rawPoint.x + box.x[2], wall.x1, wall.x2)) {
      const interior = Math.sign(dx) * winding;
      const face = wall.y1 + interior * wall.thickness / 2;
      candidates.y.push({ value: face - box.y[interior < 0 ? 2 : 0], guide: face });
    }
  }

  for (const neighbor of plan.furniture) {
    if (neighbor.id === item.id) continue;
    const neighborBox = getFurnitureOffsets(neighbor);
    addFurnitureTargets(candidates.x, box.x, neighbor.x, neighborBox.x);
    addFurnitureTargets(candidates.y, box.y, neighbor.y, neighborBox.y);
  }

  const capture = SNAP_CAPTURE_DISTANCE / scale;
  const release = SNAP_RELEASE_DISTANCE / scale;
  const x = getMagneticSnap(rawPoint.x, candidates.x, activeLock(locks.x, candidates.x), capture, release);
  const y = getMagneticSnap(rawPoint.y, candidates.y, activeLock(locks.y, candidates.y), capture, release);

  return { point: { x: x?.value ?? rawPoint.x, y: y?.value ?? rawPoint.y }, locks: { x, y } };
}

export function snapFurnitureRotation(rotation: number, lock?: SnapCandidate, wallAngles: readonly number[] = []) {
  const targets = [0, ...wallAngles].map((angle) => {
    const target = angle + Math.round((rotation - angle) / 90) * 90;
    return { value: target, guide: target };
  });
  const lockedTurn = lock && lock.value + Math.round((rotation - lock.value) / 360) * 360;
  const equivalentLock = lockedTurn === undefined ? undefined : { value: lockedTurn, guide: lockedTurn };
  const nextLock = getMagneticSnap(rotation, targets, equivalentLock, 5, 9);
  return { rotation: nextLock?.value ?? rotation, lock: nextLock };
}

export function getNearbyWallAngles(plan: RoomFloorPlan, item: FurnitureItem, scale: number): number[] {
  const center = { x: item.x + item.width / 2, y: item.y + item.height / 2 };
  const reach = Math.hypot(item.width, item.height) / 2 + SNAP_RELEASE_DISTANCE / scale;
  return plan.walls.flatMap((wall) => {
    const dx = wall.x2 - wall.x1;
    const dy = wall.y2 - wall.y1;
    if (dx === 0 || dy === 0) return [];

    const fraction = Math.max(0, Math.min(1, ((center.x - wall.x1) * dx + (center.y - wall.y1) * dy) / (dx * dx + dy * dy)));
    const distance = Math.hypot(center.x - (wall.x1 + fraction * dx), center.y - (wall.y1 + fraction * dy));
    return distance <= reach ? [Math.atan2(dy, dx) * 180 / Math.PI] : [];
  });
}

function activeLock(lock: SnapCandidate | undefined, candidates: readonly SnapCandidate[]) {
  return lock && candidates.some(({ value }) => value === lock.value) ? lock : undefined;
}

function overlaps(start: number, end: number, segmentStart: number, segmentEnd: number): boolean {
  return end > Math.min(segmentStart, segmentEnd) && start < Math.max(segmentStart, segmentEnd);
}

type AxisOffsets = [start: number, center: number, end: number];

function addFurnitureTargets(
  candidates: SnapCandidate[], offsets: AxisOffsets, origin: number, reference: AxisOffsets,
) {
  candidates.push({ value: origin + reference[1] - offsets[1], guide: origin + reference[1] });
  for (const edge of [reference[0], reference[2]]) {
    const guide = origin + edge;
    candidates.push({ value: guide - offsets[0], guide }, { value: guide - offsets[2], guide });
  }
}

function getFurnitureOffsets(item: FurnitureItem): { x: AxisOffsets; y: AxisOffsets } {
  const centerX = item.width / 2;
  const centerY = item.height / 2;
  const outline = getFurniturePreset(item.type, item.catalogId).outline;
  if (outline.kind === 'circle') {
    return { x: [0, centerX, item.width], y: [0, centerY, item.height] };
  }

  const angle = item.rotation * Math.PI / 180;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  if (outline.kind === 'polygon') {
    const rotated = outline.points.map(({ x, y }) => {
      const relativeX = x * item.width - centerX;
      const relativeY = y * item.height - centerY;
      return {
        x: centerX + relativeX * cosine - relativeY * sine,
        y: centerY + relativeX * sine + relativeY * cosine,
      };
    });
    return {
      x: [Math.min(...rotated.map(({ x }) => x)), centerX, Math.max(...rotated.map(({ x }) => x))],
      y: [Math.min(...rotated.map(({ y }) => y)), centerY, Math.max(...rotated.map(({ y }) => y))],
    };
  }

  const xRadius = Math.abs(cosine) * centerX + Math.abs(sine) * centerY;
  const yRadius = Math.abs(sine) * centerX + Math.abs(cosine) * centerY;
  return {
    x: [centerX - xRadius, centerX, centerX + xRadius],
    y: [centerY - yRadius, centerY, centerY + yRadius],
  };
}
