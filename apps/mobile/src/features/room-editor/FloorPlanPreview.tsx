import { Canvas, Group, Line, Path, vec } from '@shopify/react-native-skia';
import type { RoomFloorPlan } from '@restructuring-home/domain';
import { useMemo, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useCanvasPanGesture } from '../../components/FlowScrollGesture';
import { FurnitureDrawing } from '../furniture/ui/FurnitureDrawing';
import { colors } from '../../theme/colors';
import { getFloorPlanCanvasGeometry } from './floorPlanCanvasGeometry';
import { getFloorPlanPreviewMetrics } from './floorPlanPreviewMetrics';
import { validateRoomOutline } from '../room-plan/model/roomOutline';

interface FloorPlanPreviewProps {
  plan: RoomFloorPlan;
}

export function FloorPlanPreview({ plan }: FloorPlanPreviewProps) {
  const [canvasWidth, setCanvasWidth] = useState(0);
  const pan = useCanvasPanGesture();
  const metrics = getFloorPlanPreviewMetrics(plan);
  const canvasHeight = canvasWidth > 0 ? Math.min(360, canvasWidth * (plan.height / plan.width)) : 320;
  const geometry = useMemo(
    () => getFloorPlanCanvasGeometry(plan, canvasWidth || 1, canvasHeight),
    [canvasHeight, canvasWidth, plan],
  );
  const interiorPath = validateRoomOutline(plan).isValid
    ? geometry.walls.map((wall, index) => `${index === 0 ? 'M' : 'L'} ${wall.x1} ${wall.y1}`).join(' ') + ' Z'
    : undefined;

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
              {interiorPath ? <Path path={interiorPath} color="#1C293B" /> : null}
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
                <Line
                  key={opening.id}
                  p1={vec(opening.x, opening.y)}
                  p2={vec(opening.endX, opening.endY)}
                  strokeWidth={8}
                  strokeCap="round"
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
                    <FurnitureDrawing {...item} />
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
        <GestureDetector gesture={pan}>
          <View collapsable={false} style={StyleSheet.absoluteFill} />
        </GestureDetector>
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
    backgroundColor: 'rgba(15,23,42,0.84)',
    borderRadius: 4,
    paddingHorizontal: 4,
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
