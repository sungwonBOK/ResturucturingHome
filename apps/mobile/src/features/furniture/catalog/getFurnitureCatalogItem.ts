import type { FurnitureItem, FurnitureType, FurnitureUse } from '@restructuring-home/domain';
import { furnitureCatalog, type FurniturePreset } from './furnitureCatalog';

const presetsById = new Map(
  furnitureCatalog.flatMap(({ type, presets }) => presets.map((preset) => [preset.id, { type, preset }] as const)),
);

export function getFurniturePreset(type: FurnitureType, catalogId?: string): FurniturePreset {
  const match = catalogId ? presetsById.get(catalogId) : undefined;
  if (match?.type === type) {
    return match.preset;
  }

  const category = furnitureCatalog.find((item) => item.type === type)
    ?? furnitureCatalog.find((item) => item.id === 'custom');
  return (category ?? furnitureCatalog[0]).presets[0];
}

export function getFurnitureCatalogItem(type: FurnitureType) {
  const item = furnitureCatalog.find((catalogItem) => catalogItem.type === type);

  if (!item) {
    throw new Error(`Unsupported furniture type: ${type}`);
  }

  return { ...item.presets[0], type, label: item.label };
}

const defaultUses: Partial<Record<FurnitureType, FurnitureUse>> = {
  sofa: { role: 'sofa', front: 'bottom' },
  bed: { role: 'bed', front: 'bottom' },
  desk: { role: 'desk', front: 'bottom' },
  chair: { role: 'chair', front: 'bottom' },
  wardrobe: { role: 'wardrobe', front: 'bottom', clearanceCm: 65 },
  bookshelf: { role: 'bookshelf', front: 'bottom' },
  tv_stand: { role: 'tv_stand', front: 'bottom' },
};

export function getFurnitureUse(item: FurnitureItem): FurnitureUse {
  const preset = getFurniturePreset(item.type, item.catalogId);
  return {
    ...(preset.use ?? defaultUses[item.type] ?? { role: item.type }),
    ...(preset.allowsFurnitureOnTop ? { allowsFurnitureOnTop: true } : {}),
  };
}
