import { Canvas } from '@shopify/react-native-skia';
import type { FurnitureType } from '@restructuring-home/domain';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { furnitureCatalog, type FurniturePreset } from '../catalog/furnitureCatalog';
import { FurnitureDrawing } from './FurnitureDrawing';

interface FurnitureCatalogProps {
  onAdd: (type: FurnitureType, catalogId: string) => void;
}

export function FurnitureCatalog({ onAdd }: FurnitureCatalogProps) {
  const [categoryId, setCategoryId] = useState(furnitureCatalog[0].id);
  const category = furnitureCatalog.find((item) => item.id === categoryId) ?? furnitureCatalog[0];

  return (
    <View style={styles.catalog}>
      <View style={styles.categories}>
        {furnitureCatalog.map((item) => {
          const selected = item.id === category.id;
          return (
            <TouchableOpacity
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setCategoryId(item.id)}
              style={[styles.category, selected && styles.selectedCategory]}
            >
              <Text style={[styles.categoryLabel, selected && styles.selectedLabel]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.presets}>
        {category.presets.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            accessibilityRole="button"
            accessibilityLabel={`${preset.label} 추가`}
            activeOpacity={0.82}
            onPress={() => onAdd(category.type, preset.id)}
            style={styles.card}
          >
            <View style={styles.cardTop}>
              <PresetThumbnail preset={preset} />
              <Text style={styles.add}>+</Text>
            </View>
            <Text style={styles.name}>{preset.label}</Text>
            <Text style={styles.dimensions}>
              {preset.outline.kind === 'circle' ? `지름 ${preset.width} cm` : `${preset.width} × ${preset.height} cm`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function PresetThumbnail({ preset }: { preset: FurniturePreset }) {
  const scale = Math.min(54 / preset.width, 40 / preset.height);
  const width = preset.width * scale;
  const height = preset.height * scale;

  return (
    <Canvas pointerEvents="none" style={styles.thumbnail}>
      <FurnitureDrawing x={(64 - width) / 2} y={(48 - height) / 2} width={width} height={height} preset={preset} />
    </Canvas>
  );
}

const styles = StyleSheet.create({
  catalog: { gap: 12 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  category: { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  selectedCategory: { backgroundColor: colors.primaryDim, borderColor: colors.primary },
  categoryLabel: { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  selectedLabel: { color: colors.textPrimary },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { width: '48%', backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: 12, borderWidth: 1, padding: 10, gap: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  thumbnail: { width: 64, height: 48 },
  add: { color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 22 },
  name: { color: colors.textPrimary, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  dimensions: { color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 12 },
});
