import type { FurnitureCategory } from '../furniturePreset';
import { rectangle, circle, detail } from './presetShapes';

export const custom = {
  id: 'custom', type: 'other', label: '기타', presets: [
    { id: 'custom-rectangle', label: '직접 치수 입력', width: 100, height: 60, outline: rectangle, material: 'slateMetal', details: [], allowsCustomName: true },
  ],
} satisfies FurnitureCategory;

export const appliances = {
  id: 'appliances', type: 'other', label: '가전', presets: [
    { id: 'appliance-fridge', use: { role: 'fridge', front: 'bottom', clearanceCm: 75 }, label: '냉장고', width: 66, height: 70, outline: rectangle, material: 'whiteMetal', details: [detail(0.13, 0.75, 0.74, 0.13, 'accent'), detail(0.67, 0.79, 0.19, 0.07, 'trim')] },
    { id: 'appliance-washer', use: { role: 'washer', front: 'bottom', clearanceCm: 70 }, label: '드럼 세탁기', width: 62, height: 64, outline: rectangle, material: 'whiteMetal', details: [detail(0.12, 0.13, 0.76, 0.16, 'accent'), detail(0.70, 0.15, 0.12, 0.12, 'trim', 'oval'), detail(0.22, 0.33, 0.56, 0.54, 'glass', 'oval')] },
    { id: 'appliance-air-purifier', use: { role: 'air_purifier' }, label: '공기청정기', width: 34, height: 34, outline: circle, material: 'whiteMetal', details: [detail(0.25, 0.25, 0.50, 0.50, 'trim', 'oval'), detail(0.34, 0.34, 0.32, 0.32, 'accent', 'oval')] },
  ],
} satisfies FurnitureCategory;

export const rugs = {
  id: 'rugs', type: 'other', label: '러그', presets: [
    { id: 'rug-rectangle', use: { role: 'rug' }, label: '사각 러그', width: 160, height: 230, outline: rectangle, material: 'warmWeave', allowsFurnitureOnTop: true, details: [detail(0.07, 0.05, 0.86, 0.90, 'accent'), detail(0.11, 0.10, 0.78, 0.80)] },
    { id: 'rug-round', use: { role: 'rug' }, label: '원형 러그', width: 140, height: 140, outline: circle, material: 'wovenFabric', allowsFurnitureOnTop: true, details: [detail(0.05, 0.05, 0.90, 0.90, 'accent', 'oval'), detail(0.11, 0.11, 0.78, 0.78, 'cushion', 'oval')] },
  ],
} satisfies FurnitureCategory;
