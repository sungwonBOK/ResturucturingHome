import type { FurnitureCategory } from '../furniturePreset';
import { rectangle, detail } from './presetShapes';

const bedFrame = [
  detail(0.05, 0.04, 0.90, 0.07, 'trim'),
  detail(0.08, 0.34, 0.84, 0.60),
  detail(0.08, 0.35, 0.84, 0.12, 'accent'),
];
const doubleBed = [...bedFrame, detail(0.12, 0.15, 0.33, 0.15), detail(0.55, 0.15, 0.33, 0.15)];
const daybedDetails = [
  detail(0.08, 0.10, 0.84, 0.20, 'trim'),
  detail(0.07, 0.30, 0.12, 0.56, 'accent'),
  detail(0.81, 0.30, 0.12, 0.56, 'accent'),
  detail(0.22, 0.34, 0.56, 0.52),
];

export const beds = {
  id: 'beds', type: 'bed', label: '침대', presets: [
    { id: 'bed-double', label: '더블 침대', width: 160, height: 200, outline: rectangle, material: 'ivoryLinen', details: doubleBed },
    { id: 'bed-single', label: '싱글 침대', width: 100, height: 200, outline: rectangle, material: 'ivoryLinen', details: [...bedFrame, detail(0.22, 0.15, 0.56, 0.15)] },
    { id: 'bed-queen', label: '퀸 침대', width: 170, height: 210, outline: rectangle, material: 'ivoryLinen', details: doubleBed },
    { id: 'bed-daybed', label: '데이베드', width: 200, height: 95, outline: rectangle, material: 'sageFabric', details: daybedDetails },
  ],
} satisfies FurnitureCategory;

export const wardrobes = {
  id: 'wardrobes', type: 'wardrobe', label: '옷장', presets: [
    { id: 'wardrobe-double', use: { role: 'wardrobe', front: 'bottom', clearanceCm: 75 }, label: '양문형 옷장', width: 100, height: 60, outline: rectangle, material: 'walnut', details: [detail(0.08, 0.13, 0.40, 0.67), detail(0.52, 0.13, 0.40, 0.67), detail(0.38, 0.72, 0.06, 0.11, 'trim'), detail(0.56, 0.72, 0.06, 0.11, 'trim')] },
    { id: 'wardrobe-drawers', use: { role: 'drawer_unit', front: 'bottom', clearanceCm: 70 }, label: '서랍장', width: 80, height: 45, outline: rectangle, material: 'naturalOak', details: [detail(0.06, 0.71, 0.88, 0.15, 'trim'), detail(0.37, 0.75, 0.26, 0.07, 'accent')] },
    { id: 'wardrobe-sliding', use: { role: 'wardrobe', front: 'bottom', clearanceCm: 60 }, label: '슬라이딩 옷장', width: 160, height: 63, outline: rectangle, material: 'whiteMetal', details: [detail(0.08, 0.10, 0.50, 0.58), detail(0.51, 0.31, 0.41, 0.53, 'accent'), detail(0.06, 0.81, 0.88, 0.07, 'trim')] },
  ],
} satisfies FurnitureCategory;

export const bookshelves = {
  id: 'bookshelves', type: 'bookshelf', label: '책장', presets: [
    { id: 'bookshelf-open', label: '오픈형 책장', width: 80, height: 35, outline: rectangle, material: 'naturalOak', details: [detail(0.10, 0.20, 0.24, 0.62), detail(0.38, 0.20, 0.24, 0.62, 'accent'), detail(0.66, 0.20, 0.24, 0.62, 'trim')] },
    { id: 'bookshelf-narrow', label: '슬림 선반', width: 45, height: 27, outline: rectangle, material: 'walnut', details: [detail(0.12, 0.20, 0.35, 0.59), detail(0.53, 0.20, 0.35, 0.59, 'accent')] },
  ],
} satisfies FurnitureCategory;

export const tvStands = {
  id: 'tv-stands', type: 'tv_stand', label: 'TV장', presets: [
    { id: 'tv-stand-console', label: 'TV 콘솔', width: 140, height: 45, outline: rectangle, material: 'walnut', details: [detail(0.15, 0.15, 0.70, 0.18, 'glass'), detail(0.40, 0.48, 0.20, 0.18, 'trim'), detail(0.12, 0.75, 0.76, 0.08, 'accent')] },
  ],
} satisfies FurnitureCategory;
