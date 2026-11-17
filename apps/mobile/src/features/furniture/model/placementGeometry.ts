import type { FurnitureItem } from '@restructuring-home/domain';
import { getFurniturePreset } from '../catalog/getFurnitureCatalogItem';
import type { OutlinePoint as Point } from '../../room-plan/model/roomOutline';

export type Footprint ={ center: Point; radius: number } | { vertices: Point[] };

const EPSILON = 0.000001;
const rectangle = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];

export function getFootprint(item: FurnitureItem): Footprint {
  const outline = getFurniturePreset(item.type, item.catalogId).outline;
  const center = { x: item.x + item.width / 2, y: item.y + item.height / 2 };
  if (outline.kind === 'circle' && Math.abs(item.width - item.height) <= EPSILON) {
    return { center, radius: item.width / 2 };
  }

  const radians = item.rotation * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const points = outline.kind === 'polygon' ? outline.points : rectangle;
  return {
    vertices: points.map((point) => {
      const x = (point.x - 0.5) * item.width;
      const y = (point.y - 0.5) * item.height;
      return { x: center.x + x * cos - y * sin, y: center.y + x * sin + y * cos };
    }),
  };
}

export function fitsRoom(footprint: Footprint, room: Point[], wallWidths: number[]): boolean {
  if ('center' in footprint) {
    const { center, radius } = footprint;
    return pointLocation(center, room) >= 0 && everyEdge(room, (a, b, index) => (
      pointSegmentDistance(center, a, b) + EPSILON >= radius + wallWidths[index] / 2
    ));
  }

  return everyEdge(footprint.vertices, (a, b) => (
    pointLocation(a, room) >= 0 &&
    !segmentLocations(a, b, room).includes(-1) &&
    everyEdge(room, (start, end, index) => (
      wallWidths[index] <= 0 ||
      segmentDistance(a, b, start, end) + EPSILON >= wallWidths[index] / 2
    ))
  )) && !room.some((point) => pointLocation(point, footprint.vertices) === 1);
}

export function footprintsOverlap(first: Footprint, second: Footprint): boolean {
  if ('center' in first) {
    return 'center' in second
      ? Math.hypot(first.center.x - second.center.x, first.center.y - second.center.y) < first.radius + second.radius - EPSILON
      : circleOverlapsPolygon(first, second.vertices);
  }
  if ('center' in second) return circleOverlapsPolygon(second, first.vertices);

  return hasInteriorEdge(first.vertices, second.vertices) ||
    hasInteriorEdge(second.vertices, first.vertices);
}

export function crossesFootprint(start: Point, end: Point, footprint: Footprint): boolean {
  return 'center' in footprint
    ? pointSegmentDistance(footprint.center, start, end) < footprint.radius - EPSILON
    : segmentLocations(start, end, footprint.vertices).includes(1);
}

function circleOverlapsPolygon(circle: { center: Point; radius: number }, polygon: Point[]): boolean {
  return pointLocation(circle.center, polygon) >= 0 || !everyEdge(polygon, (a, b) => (
    pointSegmentDistance(circle.center, a, b) >= circle.radius - EPSILON
  ));
}

function hasInteriorEdge(vertices: Point[], other: Point[]): boolean {
  const orientation = Math.sign(vertices.reduce((area, point, index) => {
    const next = vertices[(index + 1) % vertices.length];
    return area + point.x * next.y - point.y * next.x;
  }, 0));

  return !everyEdge(vertices, (a, b) => {
    const delta = subtract(b, a);
    const length = Math.hypot(delta.x, delta.y);
    const interiorOffset = { x: -delta.y / length * orientation * 0.0001, y: delta.x / length * orientation * 0.0001 };
    return !segmentLocations(a, b, other, interiorOffset).includes(1);
  });
}

function everyEdge(vertices: Point[], callback: (a: Point, b: Point, index: number) => boolean): boolean {
  return vertices.every((point, index) => callback(point, vertices[(index + 1) % vertices.length], index));
}

// 벽과 만나는 지점으로 가구 모서리를 나누면, 양 끝이 방 안에 있어도 중간에 오목한 벽을 가로지르는 경우를 찾을 수 있습니다.
function segmentLocations(a: Point, b: Point, polygon: Point[], interiorOffset?: Point): number[] {
  const cuts = [0, 1];
  everyEdge(polygon, (start, end) => {
    cuts.push(...segmentCuts(a, b, start, end));
    return true;
  });
  cuts.sort((first, second) => first - second);

  return cuts.slice(1).flatMap((end, index) => {
    const start = cuts[index];
    if (end <= start) return [];
    const mid = (start + end) / 2;
    const sample = { x: a.x + (b.x - a.x) * mid, y: a.y + (b.y - a.y) * mid };
    const location = pointLocation(sample, polygon);
    return [location === 0 && interiorOffset
      ? pointLocation({ x: sample.x + interiorOffset.x, y: sample.y + interiorOffset.y }, polygon)
      : location];
  });
}

function pointLocation(point: Point, polygon: Point[]): number {
  let inside = false;
  for (let index = 0; index < polygon.length; index += 1) {
    const a = polygon[index];
    const b = polygon[(index + 1) % polygon.length];
    if (pointSegmentDistance(point, a, b) <= EPSILON) return 0;
    if ((a.y > point.y) !== (b.y > point.y) && point.x < a.x + (b.x - a.x) * (point.y - a.y) / (b.y - a.y)) {
      inside = !inside;
    }
  }
  return inside ? 1 : -1;
}

function segmentDistance(a: Point, b: Point, c: Point, d: Point): number {
  if (segmentCuts(a, b, c, d).length > 0) return 0;
  return Math.min(pointSegmentDistance(a, c, d), pointSegmentDistance(b, c, d),
    pointSegmentDistance(c, a, b), pointSegmentDistance(d, a, b));
}

function segmentCuts(a: Point, b: Point, c: Point, d: Point): number[] {
  const ab = subtract(b, a);
  const cd = subtract(d, c);
  const ac = subtract(c, a);
  const determinant = cross(ab, cd);
  if (Math.abs(determinant) > EPSILON) {
    const t = cross(ac, cd) / determinant;
    const u = cross(ac, ab) / determinant;
    return inUnitRange(t) && inUnitRange(u) ? [Math.min(1, Math.max(0, t))] : [];
  }
  if (Math.abs(cross(ac, ab)) > EPSILON) return [];

  const lengthSquared = dot(ab, ab);
  return [dot(ac, ab) / lengthSquared, dot(subtract(d, a), ab) / lengthSquared].filter(inUnitRange);
}

function pointSegmentDistance(point: Point, a: Point, b: Point): number {
  const ab = subtract(b, a);
  const ap = subtract(point, a);
  const t = Math.min(1, Math.max(0, dot(ap, ab) / (dot(ab, ab) || 1)));
  return Math.hypot(ap.x - t * ab.x, ap.y - t * ab.y);
}

function inUnitRange(value: number): boolean {
  return value >= 0 && value <= 1;
}

function subtract(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

function cross(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x;
}
