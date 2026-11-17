import { Canvas, Circle, Group, Line, vec } from '@shopify/react-native-skia';
import type { RoomFloorPlan } from '@restructuring-home/domain';
import { useMemo, useState } from 'react';
import {
  type LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { SnapGuides } from '../../editor-snapping/SnapGuides';
import { useFurnitureCanvasPan } from './useFurnitureCanvasPan';
import { FurnitureDrawing } from './FurnitureDrawing';
import { colors } from '../../../theme/colors';
import { getFloorPlanCanvasGeometry } from '../../room-editor/floorPlanCanvasGeometry';
import { getFloorPlanPreviewMetrics } from '../../room-editor/floorPlanPreviewMetrics';

interface FurnitureCanvasProps {
  plan: RoomFloorPlan;
  selectedFurnitureId?: string;
  outsideFurnitureIds?: ReadonlySet<string>;
  onSelectFurniture: (id: string | undefined) => void;
  onPlanChange: (plan: RoomFloorPlan) => void;
}

export function FurnitureCanvas({
  plan,
  selectedFurnitureId,
  outsideFurnitureIds,
  onSelectFurniture,
  onPlanChange,
}: FurnitureCanvasProps) {
  const [canvasWidth, setCanvasWidth] = useState(0);
  const metrics = getFloorPlanPreviewMetrics(plan);
  const canvasHeight = canvasWidth > 0 ? Math.min(360, canvasWidth * (plan.height / plan.width)) : 320;
  const geometry = useMemo(
    () => getFloorPlanCanvasGeometry(plan, canvasWidth || 1, canvasHeight),
    [canvasHeight, canvasWidth, plan],
  );

  const { pan, snapGuides, snappedAngle } = useFurnitureCanvasPan({ plan, geometry, selectedFurnitureId, onSelectFurniture, onPlanChange });

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
            <Canvas pointerEvents="none" style={styles.canvas}>
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

              <SnapGuides
                locks={snapGuides}
                width={canvasWidth}
                height={canvasHeight}
                toX={(x) => geometry.offsetX + x * geometry.scale}
                toY={(y) => geometry.offsetY + y * geometry.scale}
              />
              {geometry.furniture.map((item) => {
                const isSelected = item.id === selectedFurnitureId;
                const centerX = item.x + item.width / 2;
                const centerY = item.y + item.height / 2;

                return (
                  <Group
                    key={item.id}
                    origin={vec(centerX, centerY)}
                    transform={[{ rotate: (item.rotation * Math.PI) / 180 }]}
                  >
                    <FurnitureDrawing {...item} selected={isSelected} outsideRoom={outsideFurnitureIds?.has(item.id)} />
                    {isSelected ? (
                      <>
                        <Line
                          p1={vec(centerX, item.y)}
                          p2={vec(centerX, item.y - 30)}
                          color={colors.primary}
                          strokeWidth={1.5}
                        />
                        <Circle cx={item.x + item.width} cy={item.y + item.height} r={7} color={colors.primary} />
                        <Circle cx={centerX} cy={item.y - 30} r={7} color={colors.gradientEnd} />
                      </>
                    ) : null}
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
        {snappedAngle === undefined ? null : (
          <View pointerEvents="none" style={styles.angleBadge}>
            <Text style={styles.angleText}>{snappedAngle}°</Text>
          </View>
        )}
        <GestureDetector gesture={pan}>
          <View collapsable={false} style={styles.touchOverlay} />
        </GestureDetector>
      </View>

      <Text style={styles.hint}>가구를 드래그해 이동하고, 보라색 핸들로 크기 조절·민트 핸들로 회전하세요.</Text>

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
    gap: 14,
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
  angleBadge: { position: 'absolute', top: 10, right: 10, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.bgCard },
  angleText: { color: colors.success, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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
  hint: {
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
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
