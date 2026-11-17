import type { FurnitureCategory } from '../furniturePreset';
import { rectangle, circle, detail, cornerOutline } from './presetShapes';

const sofaFrame = [
  detail(0.08, 0.10, 0.84, 0.20, 'trim'),
  detail(0.07, 0.30, 0.12, 0.56, 'accent'),
  detail(0.81, 0.30, 0.12, 0.56, 'accent'),
];
const sofaDetails = [...sofaFrame, detail(0.22, 0.36, 0.26, 0.52), detail(0.52, 0.36, 0.26, 0.52)];
const chaiseBack = [detail(0.07, 0.06, 0.86, 0.12, 'trim'), detail(0.40, 0.23, 0.20, 0.20)];

export const sofas = {
  id: 'sofas', type: 'sofa', label: '소파', presets: [
    { id: 'sofa-straight', label: '일자 소파', width: 200, height: 90, outline: rectangle, material: 'wovenFabric', details: sofaDetails },
    { id: 'sofa-chaise-left', label: '카우치 소파 · 좌형', width: 240, height: 155, outline: cornerOutline('left', 0.37, 0.51), material: 'sageFabric', details: [...chaiseBack, detail(0.09, 0.23, 0.20, 0.66), detail(0.69, 0.23, 0.20, 0.20)] },
    { id: 'sofa-chaise-right', label: '카우치 소파 · 우형', width: 240, height: 155, outline: cornerOutline('right', 0.37, 0.51), material: 'sageFabric', details: [...chaiseBack, detail(0.71, 0.23, 0.20, 0.66), detail(0.11, 0.23, 0.20, 0.20)] },
    { id: 'sofa-loveseat', label: '컴팩트 2인 소파', width: 135, height: 76, outline: rectangle, material: 'warmWeave', details: sofaDetails },
    { id: 'sofa-armchair', label: '1인 암체어', width: 82, height: 80, outline: rectangle, material: 'wovenFabric', details: [...sofaFrame, detail(0.24, 0.35, 0.52, 0.50)] },
  ],
} satisfies FurnitureCategory;

export const desks = {
  id: 'desks', type: 'desk', label: '책상', presets: [
    { id: 'desk-straight', label: '직선 책상', width: 120, height: 60, outline: rectangle, material: 'naturalOak', details: [detail(0.24, 0.12, 0.48, 0.10, 'trim'), detail(0.39, 0.22, 0.18, 0.12, 'trim'), detail(0.76, 0.14, 0.16, 0.72)] },
    { id: 'desk-corner-left', label: 'ㄱ자 책상 · 좌형', width: 150, height: 125, outline: cornerOutline('left', 0.34, 0.45), material: 'walnut', details: [detail(0.40, 0.08, 0.45, 0.10, 'trim'), detail(0.07, 0.54, 0.19, 0.36)] },
    { id: 'desk-corner-right', label: 'ㄱ자 책상 · 우형', width: 150, height: 125, outline: cornerOutline('right', 0.34, 0.45), material: 'walnut', details: [detail(0.15, 0.08, 0.45, 0.10, 'trim'), detail(0.74, 0.54, 0.19, 0.36)] },
    { id: 'desk-vanity', use: { role: 'vanity', front: 'bottom' }, label: '화장대', width: 85, height: 45, outline: rectangle, material: 'naturalOak', details: [detail(0.24, 0.07, 0.52, 0.18, 'glass', 'oval'), detail(0.10, 0.67, 0.80, 0.09, 'trim')] },
  ],
} satisfies FurnitureCategory;

export const diningTables = {
  id: 'dining-tables', type: 'dining_table', label: '식탁', presets: [
    { id: 'dining-table-rectangle', label: '사각 식탁', width: 120, height: 80, outline: rectangle, material: 'naturalOak', details: [] },
    { id: 'dining-table-round', label: '원형 식탁', width: 100, height: 100, outline: circle, material: 'naturalOak', details: [] },
    { id: 'dining-table-corner-left', label: 'ㄱ자 식탁 · 좌형', width: 150, height: 125, outline: cornerOutline('left', 0.36, 0.46), material: 'walnut', details: [] },
    { id: 'dining-table-corner-right', label: 'ㄱ자 식탁 · 우형', width: 150, height: 125, outline: cornerOutline('right', 0.36, 0.46), material: 'walnut', details: [] },
  ],
} satisfies FurnitureCategory;

export const livingTables = {
  id: 'living-tables', type: 'dining_table', label: '거실 테이블', presets: [
    { id: 'coffee-table-round', use: { role: 'coffee_table' }, label: '원형 커피 테이블', width: 70, height: 70, outline: circle, material: 'walnut', details: [] },
    { id: 'coffee-table-low', use: { role: 'coffee_table' }, label: '낮은 소파 테이블', width: 105, height: 55, outline: rectangle, material: 'naturalOak', details: [] },
    { id: 'side-table-round', use: { role: 'side_table' }, label: '원형 사이드 테이블', width: 42, height: 42, outline: circle, material: 'slateMetal', details: [] },
  ],
} satisfies FurnitureCategory;

export const chairs = {
  id: 'chairs', type: 'chair', label: '의자', presets: [
    { id: 'chair-backed', label: '등받이 의자', width: 50, height: 50, outline: rectangle, material: 'naturalOak', details: [detail(0.10, 0.09, 0.80, 0.15, 'trim'), detail(0.17, 0.30, 0.66, 0.56)] },
    { id: 'chair-stool', use: { role: 'chair' }, label: '원형 스툴', width: 40, height: 40, outline: circle, material: 'warmWeave', details: [] },
    { id: 'chair-office', label: '사무용 의자', width: 65, height: 65, outline: rectangle, material: 'slateMetal', details: [detail(0.13, 0.10, 0.74, 0.16, 'trim'), detail(0.08, 0.32, 0.13, 0.46, 'trim'), detail(0.79, 0.32, 0.13, 0.46, 'trim'), detail(0.26, 0.29, 0.48, 0.58, 'cushion', 'oval')] },
    { id: 'chair-bench', use: { role: 'chair' }, label: '벤치', width: 100, height: 35, outline: rectangle, material: 'naturalOak', details: [detail(0.09, 0.25, 0.82, 0.50)] },
  ],
} satisfies FurnitureCategory;
