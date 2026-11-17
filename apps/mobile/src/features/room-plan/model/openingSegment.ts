import type { Opening, Wall } from '@restructuring-home/domain';

export function getOpeningSegment(opening: Opening, wall: Wall) {
  const dx = wall.x2 - wall.x1;
  const dy = wall.y2 - wall.y1;
  const length = Math.hypot(dx, dy);
  if (!(length > 0) || !(opening.width > 0)) return undefined;

  const tangent = { x: dx / length, y: dy / length };
  const direction = Math.sign(Math.abs(dx) >= Math.abs(dy) ? dx : dy);
  const projected = (opening.x - wall.x1) * tangent.x + (opening.y - wall.y1) * tangent.y;
  const width = Math.min(length, opening.width);
  const position = direction > 0
    ? Math.max(0, Math.min(length - width, projected))
    : Math.max(width, Math.min(length, projected));
  const endPosition = position + direction * width;
  const point = (along: number) => ({ x: wall.x1 + tangent.x * along, y: wall.y1 + tangent.y * along });

  return { start: point(position), end: point(endPosition), width, tangent };
}
