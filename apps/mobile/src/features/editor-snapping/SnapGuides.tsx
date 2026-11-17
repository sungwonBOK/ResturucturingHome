import { Line, vec } from '@shopify/react-native-skia';
import { colors } from '../../theme/colors';
import type { SnapLocks } from './magneticSnap';

interface SnapGuidesProps {
  locks: SnapLocks;
  width: number;
  height: number;
  toX: (coordinate: number) => number;
  toY: (coordinate: number) => number;
}

export function SnapGuides({ locks, width, height, toX, toY }: SnapGuidesProps) {
  const x = locks.x ? toX(locks.x.guide) : undefined;
  const y = locks.y ? toY(locks.y.guide) : undefined;
  return (
    <>
      {x === undefined ? null : <Line p1={vec(x, 0)} p2={vec(x, height)} color={colors.success} strokeWidth={1.5} opacity={0.8} />}
      {y === undefined ? null : <Line p1={vec(0, y)} p2={vec(width, y)} color={colors.success} strokeWidth={1.5} opacity={0.8} />}
    </>
  );
}
