import type { FurnitureItem, Opening, RoomFloorPlan, Wall } from '@restructuring-home/domain';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { getFloorPlanPreviewMetrics } from './floorPlanPreviewMetrics';

interface FloorPlanPreviewProps {
  plan: RoomFloorPlan;
}

export function FloorPlanPreview({ plan }: FloorPlanPreviewProps) {
  const metrics = getFloorPlanPreviewMetrics(plan);

  return (
    <View style={styles.container}>
      <View style={[styles.canvas, { aspectRatio: plan.width / plan.height }]}>
        {plan.walls.map((wall) => (
          <WallSegment key={wall.id} wall={wall} plan={plan} />
        ))}

        {plan.windows.map((opening) => (
          <OpeningSegment key={opening.id} opening={opening} plan={plan} variant="window" />
        ))}

        {plan.doors.map((opening) => (
          <OpeningSegment key={opening.id} opening={opening} plan={plan} variant="door" />
        ))}

        {plan.furniture.map((item) => (
          <FurnitureBlock key={item.id} item={item} plan={plan} />
        ))}
      </View>

      <View style={styles.metricsRow}>
        <Metric label="크기" value={metrics.sizeLabel} />
        <Metric label="벽" value={`${metrics.wallCount}`} />
        <Metric label="개구부" value={`${metrics.openingCount}`} />
        <Metric label="가구" value={`${metrics.furnitureCount}`} />
      </View>
    </View>
  );
}

function WallSegment({ wall, plan }: { wall: Wall; plan: RoomFloorPlan }) {
  const left = Math.min(wall.x1, wall.x2);
  const top = Math.min(wall.y1, wall.y2);
  const width = Math.abs(wall.x2 - wall.x1);
  const height = Math.abs(wall.y2 - wall.y1);
  const isHorizontal = height === 0;

  return (
    <View
      style={[
        styles.wall,
        {
          left: `${(left / plan.width) * 100}%`,
          top: `${(top / plan.height) * 100}%`,
          width: isHorizontal ? `${(width / plan.width) * 100}%` : wall.thickness,
          height: isHorizontal ? wall.thickness : `${(height / plan.height) * 100}%`,
          transform: [
            { translateX: isHorizontal ? 0 : -wall.thickness / 2 },
            { translateY: isHorizontal ? -wall.thickness / 2 : 0 },
          ],
        },
      ]}
    />
  );
}

function OpeningSegment({
  opening,
  plan,
  variant,
}: {
  opening: Opening;
  plan: RoomFloorPlan;
  variant: 'door' | 'window';
}) {
  const wall = plan.walls.find((item) => item.id === opening.wallId);
  const isHorizontal = wall ? wall.y1 === wall.y2 : true;

  return (
    <View
      style={[
        styles.opening,
        variant === 'door' ? styles.door : styles.window,
        {
          left: `${(opening.x / plan.width) * 100}%`,
          top: `${(opening.y / plan.height) * 100}%`,
          width: isHorizontal ? `${(opening.width / plan.width) * 100}%` : 8,
          height: isHorizontal ? 8 : `${(opening.width / plan.height) * 100}%`,
          transform: [
            { translateX: isHorizontal ? 0 : -4 },
            { translateY: isHorizontal ? -4 : 0 },
          ],
        },
      ]}
    />
  );
}

function FurnitureBlock({ item, plan }: { item: FurnitureItem; plan: RoomFloorPlan }) {
  return (
    <View
      style={[
        styles.furniture,
        {
          left: `${(item.x / plan.width) * 100}%`,
          top: `${(item.y / plan.height) * 100}%`,
          width: `${(item.width / plan.width) * 100}%`,
          height: `${(item.height / plan.height) * 100}%`,
          transform: [{ rotate: `${item.rotation}deg` }],
        },
      ]}
    >
      <Text style={styles.furnitureLabel} numberOfLines={1}>
        {item.label ?? item.type}
      </Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  canvas: {
    width: '100%',
    maxHeight: 360,
    borderRadius: 14,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.25)',
    overflow: 'hidden',
    position: 'relative',
  },
  wall: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#CBD5E1',
  },
  opening: {
    position: 'absolute',
    borderRadius: 999,
  },
  door: {
    backgroundColor: colors.success,
  },
  window: {
    backgroundColor: colors.primary,
  },
  furniture: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.48)',
    backgroundColor: colors.primaryDim,
    paddingHorizontal: 4,
  },
  furnitureLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: colors.textPrimary,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  metric: {
    flex: 1,
    minHeight: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(15,23,42,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  metricValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  metricLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
