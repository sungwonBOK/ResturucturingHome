import { Canvas, Circle, Line, Path, vec } from '@shopify/react-native-skia';
import type { RoomFloorPlan } from '@restructuring-home/domain';
import { useMemo, useRef, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useCanvasPanGesture } from '../../../components/FlowScrollGesture';
import { colors } from '../../../theme/colors';
import { SnapGuides } from '../../editor-snapping/SnapGuides';
import type { SnapLocks } from '../../editor-snapping/magneticSnap';
import { getFloorPlanCanvasTransform } from '../../room-editor/floorPlanCanvasGeometry';
import { findOpening, findPlanTarget, getOpeningRange, moveOpening, type PlanTarget } from '../model/openingEditing';
import { getOpeningSegment } from '../model/openingSegment';
import { getOutlineVertices, insertOutlineVertex, moveOutlineVertex, resizeRoomOutline, validateRoomOutline, type OutlinePoint } from '../model/roomOutline';
import { snapRoomVertex } from '../model/roomVertexSnapping';
import { OpeningPanel } from './OpeningPanel';

interface RoomPlanSetupEditorProps {
  plan: RoomFloorPlan;
  onPlanChange: (plan: RoomFloorPlan) => void;
}

interface ActiveVertexGesture {
  index: number;
  point: OutlinePoint;
  plan: RoomFloorPlan;
  canvasHeight: number;
  transform: ReturnType<typeof getFloorPlanCanvasTransform>;
  locks: SnapLocks;
}

interface ActiveOpeningGesture {
  id: string;
  start: number;
  plan: RoomFloorPlan;
  scale: number;
  tangent: OutlinePoint;
}

export function RoomPlanSetupEditor({ plan, onPlanChange }: RoomPlanSetupEditorProps) {
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [snapGuides, setSnapGuides] = useState<SnapLocks>({});
  const activeGestureRef = useRef<ActiveVertexGesture | undefined>(undefined);
  const activeOpeningRef = useRef<ActiveOpeningGesture | undefined>(undefined);
  const [selection, setSelection] = useState<PlanTarget>();
  const validation = validateRoomOutline(plan);
  const fittedHeight = canvasWidth > 0 ? Math.min(360, Math.max(240, canvasWidth * (plan.height / plan.width))) : 300;
  const fittedTransform = useMemo(() => getFloorPlanCanvasTransform(plan, canvasWidth || 1, fittedHeight, 28), [fittedHeight, canvasWidth, plan]);
  const canvasHeight = activeGestureRef.current?.canvasHeight ?? fittedHeight;
  const transform = activeGestureRef.current?.transform ?? fittedTransform;
  const vertices = getOutlineVertices(plan);
  const interiorPath = validation.isValid
    ? vertices.map((point, index) => `${index === 0 ? 'M' : 'L'} ${transform.toX(point.x)} ${transform.toY(point.y)}`).join(' ') + ' Z'
    : undefined;

  const pan = useCanvasPanGesture()
    .onBegin(({ x, y }) => {
      const index = findVertexIndex(vertices, { x, y }, transform);

      if (index === undefined) {
        // 꼭짓점이 아니면 문·창 또는 벽을 선택하고, 문·창은 벽을 따라 끌 수 있게 준비합니다.
        const point = { x: (x - transform.offsetX) / transform.scale, y: (y - transform.offsetY) / transform.scale };
        const target = findPlanTarget(plan, point, 22 / transform.scale);
        setSelection(target);
        const range = target?.kind === 'opening' ? getOpeningRange(plan, target.id) : undefined;
        const wallId = target?.kind === 'opening' ? findOpening(plan, target.id)?.wallId : undefined;
        const wall = plan.walls.find((item) => item.id === wallId);
        if (target && range && wall) {
          const length = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
          activeOpeningRef.current = {
            id: target.id, start: range.start, plan, scale: transform.scale,
            tangent: { x: (wall.x2 - wall.x1) / length, y: (wall.y2 - wall.y1) / length },
          };
        }
        return;
      }

      activeGestureRef.current = {
        index,
        point: vertices[index],
        plan,
        canvasHeight,
        transform,
        locks: {},
      };
    })
    .onUpdate(({ translationX, translationY }) => {
      const openingDrag = activeOpeningRef.current;
      if (openingDrag) {
        const along = (translationX * openingDrag.tangent.x + translationY * openingDrag.tangent.y) / openingDrag.scale;
        onPlanChange(moveOpening(openingDrag.plan, openingDrag.id, openingDrag.start + along));
        return;
      }

      const activeGesture = activeGestureRef.current;

      if (!activeGesture) {
        return;
      }

      const scale = activeGesture.transform.scale;
      const point = {
        x: Math.max(0, activeGesture.point.x + translationX / scale),
        y: Math.max(0, activeGesture.point.y + translationY / scale),
      };
      const snapped = snapRoomVertex(activeGesture.plan, activeGesture.index, point, scale, activeGesture.locks);
      let nextPlan = moveOutlineVertex(activeGesture.plan, activeGesture.index, snapped.point);
      if ((snapped.locks.x || snapped.locks.y) && !validateRoomOutline(nextPlan).isValid) {
        nextPlan = moveOutlineVertex(activeGesture.plan, activeGesture.index, point);
        activeGesture.locks = {};
      } else {
        activeGesture.locks = snapped.locks;
      }
      setSnapGuides(activeGesture.locks);
      onPlanChange(nextPlan);
    })
    .onFinalize(() => {
      activeGestureRef.current = undefined;
      activeOpeningRef.current = undefined;
      setSnapGuides({});
    });

  const updateSize = (width: number, height: number) => {
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      onPlanChange(resizeRoomOutline(plan, width, height));
    }
  };

  const addVertex = () => {
    const wallIndex = plan.walls
      .map((wall, index) => ({
        index,
        length: Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1),
        hasOpening: plan.doors.some((opening) => opening.wallId === wall.id) || plan.windows.some((opening) => opening.wallId === wall.id),
      }))
      .filter((wall) => !wall.hasOpening)
      .sort((first, second) => second.length - first.length)[0]?.index;

    if (wallIndex !== undefined) {
      onPlanChange(insertOutlineVertex(plan, wallIndex));
    }
  };

  const handleCanvasLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;

    if (nextWidth > 0 && Math.abs(nextWidth - canvasWidth) > 0.5) {
      setCanvasWidth(nextWidth);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.dimensionRow}>
        <DimensionInput key={`width-${plan.width}`} label="가로" value={plan.width} onCommit={(width) => updateSize(width, plan.height)} />
        <DimensionInput key={`height-${plan.height}`} label="세로" value={plan.height} onCommit={(height) => updateSize(plan.width, height)} />
      </View>
      <TouchableOpacity activeOpacity={0.85} onPress={addVertex} style={styles.addVertexButton}>
        <Text style={styles.addVertexButtonText}>+ 꼭짓점 추가</Text>
      </TouchableOpacity>

      <GestureDetector gesture={pan}>
        <View collapsable={false} style={[styles.canvasFrame, { height: canvasHeight }]} onLayout={handleCanvasLayout}>
          {canvasWidth > 0 ? (
            <Canvas pointerEvents="none" style={styles.canvas}>
              {interiorPath ? <Path path={interiorPath} color={colors.primaryDim} /> : null}
              {plan.walls.map((wall) => (
                <Line
                  key={wall.id}
                  p1={vec(transform.toX(wall.x1), transform.toY(wall.y1))}
                  p2={vec(transform.toX(wall.x2), transform.toY(wall.y2))}
                  color="#CBD5E1"
                  strokeWidth={Math.max(2, wall.thickness * transform.scale)}
                  strokeCap="round"
                />
              ))}
              {[...plan.windows, ...plan.doors].map((opening) => {
                const wall = plan.walls.find(({ id }) => id === opening.wallId);
                const segment = wall && getOpeningSegment(opening, wall);
                if (!segment) return null;
                const isSelected = selection?.kind === 'opening' && selection.id === opening.id;
                return <Line key={opening.id}
                  p1={vec(transform.toX(segment.start.x), transform.toY(segment.start.y))}
                  p2={vec(transform.toX(segment.end.x), transform.toY(segment.end.y))}
                  color={isSelected ? colors.textPrimary : plan.doors.includes(opening) ? colors.success : colors.primary}
                  strokeWidth={isSelected ? 11 : 8} strokeCap="round" />;
              })}
              {plan.walls.filter((wall) => selection?.kind === 'wall' && selection.id === wall.id).map((wall) => (
                <Line key={`selected-${wall.id}`}
                  p1={vec(transform.toX(wall.x1), transform.toY(wall.y1))}
                  p2={vec(transform.toX(wall.x2), transform.toY(wall.y2))}
                  color={colors.gradientEnd} strokeWidth={4} strokeCap="round" />
              ))}
              <SnapGuides locks={snapGuides} width={canvasWidth} height={canvasHeight} toX={transform.toX} toY={transform.toY} />
              {vertices.map((vertex, index) => (
                <Circle key={`${index}-${vertex.x}-${vertex.y}`} cx={transform.toX(vertex.x)} cy={transform.toY(vertex.y)} r={8} color={colors.gradientEnd} />
              ))}
            </Canvas>
          ) : null}
        </View>
      </GestureDetector>

      <Text style={styles.hint}>꼭짓점을 추가한 뒤 민트색 점을 드래그해 ㄱ자 등 원하는 방 모양으로 바꿔보세요.</Text>
      {!validation.isValid && validation.message ? <Text style={styles.error}>{validation.message}</Text> : null}
      <OpeningPanel plan={plan} selection={selection} onSelect={setSelection} onPlanChange={onPlanChange} />
    </View>
  );
}

function DimensionInput({ label, value, onCommit }: { label: string; value: number; onCommit: (value: number) => void }) {
  const [text, setText] = useState(String(value));

  return (
    <View style={styles.dimensionField}>
      <Text style={styles.dimensionLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          onEndEditing={() => {
            const nextValue = Number(text);
            if (Number.isFinite(nextValue) && nextValue > 0) {
              onCommit(nextValue);
            } else {
              setText(String(value));
            }
          }}
          keyboardType="number-pad"
          style={styles.input}
        />
        <Text style={styles.unit}>cm</Text>
      </View>
    </View>
  );
}

function findVertexIndex(vertices: OutlinePoint[], point: OutlinePoint, transform: ReturnType<typeof getFloorPlanCanvasTransform>) {
  const hitRadius = 22;

  const index = vertices.findIndex((vertex) => Math.hypot(transform.toX(vertex.x) - point.x, transform.toY(vertex.y) - point.y) <= hitRadius);

  return index >= 0 ? index : undefined;
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: 16, borderWidth: 1, gap: 14, padding: 18 },
  dimensionRow: { flexDirection: 'row', gap: 10 },
  dimensionField: { flex: 1, gap: 6 },
  dimensionLabel: { color: colors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 12 },
  inputRow: { alignItems: 'center', backgroundColor: colors.bg, borderColor: colors.border, borderRadius: 10, borderWidth: 1, flexDirection: 'row', paddingHorizontal: 12 },
  input: { color: colors.textPrimary, flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 15, paddingVertical: 11 },
  unit: { color: colors.textMuted, fontFamily: 'Inter_500Medium', fontSize: 12 },
  addVertexButton: { alignItems: 'center', backgroundColor: colors.primaryDim, borderColor: 'rgba(129,140,248,0.34)', borderRadius: 10, borderWidth: 1, paddingVertical: 10 },
  addVertexButtonText: { color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  canvasFrame: { backgroundColor: colors.bg, borderColor: 'rgba(129,140,248,0.25)', borderRadius: 14, borderWidth: 1, overflow: 'hidden', position: 'relative', width: '100%' },
  canvas: { flex: 1 },
  hint: { color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  error: { color: colors.error, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18 },
});
