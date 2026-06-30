import { Canvas, Group, Line, RoundedRect, vec } from '@shopify/react-native-skia';
import type { RoomFloorPlan } from '@restructuring-home/domain';
import { useMemo, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { getFloorPlanCanvasGeometry } from './floorPlanCanvasGeometry';
import { getFloorPlanPreviewMetrics } from './floorPlanPreviewMetrics';

interface FloorPlanPreviewProps {
  plan: RoomFloorPlan;
}

export function FloorPlanPreview({ plan }: FloorPlanPreviewProps) {
  const [canvasWidth, setCanvasWidth] = useState(0);
  const metrics = getFloorPlanPreviewMetrics(plan);
  const canvasHeight = canvasWidth > 0 ? Math.min(360, canvasWidth * (plan.height / plan.width)) : 320;
  const geometry = useMemo(
    () => getFloorPlanCanvasGeometry(plan, canvasWidth || 1, canvasHeight),
    [canvasHeight, canvasWidth, plan],
  );

  const handleCanvasLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;

    if (nextWidth > 0 && Math.abs(nextWidth - canvasWidth) > 0.5) {
      setCanvasWidth(nextWidth);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.canvasFrame, { height: canvasHeight }]} onLayout={handleCanvasLayout}>
        {canvasWidth > 0 ? (
          <>
            <Canvas style={styles.canvas}>
              {geometry.walls.map((wall) => (
                <Line
                  key={wall.id}
                  p1={vec(wall.x1, wall.y1)}
                  p2={vec(wall.x2, wall.y2)}
                  color="#CBD5E1"
                  strokeWidth={wall.thickness}
                  strokeCap="round"
                />
              ))}

              {geometry.openings.map((opening) => (
                <RoundedRect
                  key={opening.id}
                  x={opening.isHorizontal ? opening.x : opening.x - 4}
                  y={opening.isHorizontal ? opening.y - 4 : opening.y}
                  width={opening.isHorizontal ? opening.width : 8}
                  height={opening.isHorizontal ? 8 : opening.width}
                  r={4}
                  color={opening.variant === 'door' ? colors.success : colors.primary}
                />
              ))}

              {geometry.furniture.map((item) => {
                const centerX = item.x + item.width / 2;
                const centerY = item.y + item.height / 2;

                return (
                  <Group
                    key={item.id}
                    origin={vec(centerX, centerY)}
                    transform={[{ rotate: (item.rotation * Math.PI) / 180 }]}
                  >
                    <RoundedRect
                      x={item.x}
                      y={item.y}
                      width={item.width}
                      height={item.height}
                      r={10}
                      color={colors.primaryDim}
                    />
                    <RoundedRect
                      x={item.x}
                      y={item.y}
                      width={item.width}
                      height={item.height}
                      r={10}
                      color="rgba(129,140,248,0.48)"
                      style="stroke"
                      strokeWidth={1}
                    />
                  </Group>
                );
              })}
            </Canvas>

            {geometry.furniture.map((item) => (
              <View
                key={item.id}
                pointerEvents="none"
                style={[
                  styles.furnitureLabelWrap,
                  {
                    left: item.x,
                    top: item.y,
                    width: item.width,
                    height: item.height,
                  },
                ]}
              >
                <Text style={styles.furnitureLabel} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
            ))}
          </>
        ) : null}
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
  canvasFrame: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.25)',
    overflow: 'hidden',
    position: 'relative',
  },
  canvas: {
    flex: 1,
  },
  furnitureLabelWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
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
