import type { FurnitureItem, FurnitureType, RoomFloorPlan } from '@restructuring-home/domain';
import { useEffect, useMemo, useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { getFurniturePreset } from '../catalog/getFurnitureCatalogItem';
import { addFurniture, createFurnitureId, setFurnitureDimensions } from '../model/furnitureEditing';
import { findFurnitureOutsideRoom } from '../model/roomFit';
import { FurnitureCanvas } from './FurnitureCanvas';
import { FurnitureCatalog } from './FurnitureCatalog';

interface FurnitureEditorProps {
  plan: RoomFloorPlan;
  onPlanChange: (plan: RoomFloorPlan) => void;
}

export function FurnitureEditor({ plan, onPlanChange }: FurnitureEditorProps) {
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | undefined>();
  const selectedFurniture = plan.furniture.find((item) => item.id === selectedFurnitureId);
  const outsideFurniture = useMemo(() => findFurnitureOutsideRoom(plan), [plan]);
  const outsideFurnitureIds = useMemo(() => new Set(outsideFurniture.map(({ id }) => id)), [outsideFurniture]);

  useEffect(() => {
    if (selectedFurnitureId && !selectedFurniture) {
      setSelectedFurnitureId(undefined);
    }
  }, [selectedFurniture, selectedFurnitureId]);

  const handleFurnitureAdd = (type: FurnitureType, catalogId: string) => {
    const id = createFurnitureId(plan.furniture, type);
    onPlanChange(addFurniture(plan, type, id, catalogId));
    setSelectedFurnitureId(id);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>가구 추가</Text>
      <FurnitureCatalog onAdd={handleFurnitureAdd} />
      {outsideFurniture.length ? (
        <Text accessibilityLiveRegion="polite" style={styles.warning}>
          방 밖에 있는 가구가 있어요: {outsideFurniture.map((item) => item.label ?? item.id).join(', ')}. 빨간 테두리 가구를 방 안으로 옮겨 주세요.
        </Text>
      ) : null}
      <FurnitureCanvas
        plan={plan}
        selectedFurnitureId={selectedFurnitureId}
        outsideFurnitureIds={outsideFurnitureIds}
        onSelectFurniture={setSelectedFurnitureId}
        onPlanChange={onPlanChange}
      />
      {selectedFurniture ? (
        <FurnitureDimensions
          key={`${selectedFurniture.id}-${selectedFurniture.width}-${selectedFurniture.height}`}
          item={selectedFurniture}
          onApply={(width, height, label) => onPlanChange(setFurnitureDimensions(plan, selectedFurniture.id, width, height, label))}
        />
      ) : null}
    </View>
  );
}

function FurnitureDimensions({ item, onApply }: {
  item: FurnitureItem;
  onApply: (width: number, height: number, label?: string) => void;
}) {
  const preset = getFurniturePreset(item.type, item.catalogId);
  const circular = preset.outline.kind === 'circle';
  const custom = preset.allowsCustomName;
  const [width, setWidth] = useState(() => formatDimension(item.width));
  const [height, setHeight] = useState(() => formatDimension(item.height));
  const [name, setName] = useState(() => item.label === preset.label ? '' : item.label ?? '');
  const [error, setError] = useState<string>();

  const apply = () => {
    try {
      const widthCm = Number(width.replace(',', '.'));
      const heightCm = circular ? widthCm : Number(height.replace(',', '.'));
      onApply(widthCm, heightCm, custom ? name : undefined);
      setError(undefined);
      Keyboard.dismiss();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '치수를 적용하지 못했어요.');
    }
  };

  return (
    <View style={styles.form}>
      <Text style={styles.title}>{item.label ?? preset.label} 치수</Text>
      {custom ? (
        <TextInput
          accessibilityLabel="가구 이름"
          value={name}
          onChangeText={setName}
          maxLength={30}
          placeholder="가구 이름"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />
      ) : null}
      <View style={styles.fields}>
        <DimensionField label={circular ? '지름' : '가로'} value={width} onChange={setWidth} />
        {!circular ? <DimensionField label="깊이" value={height} onChange={setHeight} /> : null}
      </View>
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
      <TouchableOpacity accessibilityRole="button" onPress={apply} style={styles.apply}>
        <Text style={styles.applyLabel}>치수 적용</Text>
      </TouchableOpacity>
    </View>
  );
}

function DimensionField({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label} (cm)</Text>
      <TextInput
        accessibilityLabel={`${label} 센티미터`}
        keyboardType="decimal-pad"
        value={value}
        onChangeText={onChange}
        style={styles.input}
      />
    </View>
  );
}

function formatDimension(value: number): string {
  return String(Math.round(value * 100) / 100);
}

const styles = StyleSheet.create({
  container: { gap: 14, marginBottom: 18 },
  title: { color: colors.textPrimary, fontFamily: 'Inter_700Bold', fontSize: 20 },
  form: { gap: 10, borderRadius: 14, padding: 14, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  fields: { flexDirection: 'row', gap: 10 },
  field: { flex: 1, gap: 5 },
  fieldLabel: { color: colors.textSecondary, fontFamily: 'Inter_500Medium', fontSize: 12 },
  input: { color: colors.textPrimary, backgroundColor: colors.bg, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, minHeight: 42 },
  apply: { backgroundColor: colors.primaryDim, borderRadius: 10, alignItems: 'center', paddingVertical: 11 },
  applyLabel: { color: colors.textPrimary, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  error: { color: colors.error, fontSize: 13 },
  warning: { color: colors.error, fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19, borderRadius: 10, borderWidth: 1, borderColor: colors.error, padding: 10 },
});
