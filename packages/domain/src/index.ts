// Room JSON 공통 스키마
// iOS RoomPlan / Android ARCore 결과 모두 이 타입으로 변환됩니다

export interface RoomFloorPlan {
  width: number;   // cm
  height: number;  // cm
  walls: Wall[];
  doors: Opening[];
  windows: Opening[];
  furniture: FurnitureItem[];
}

export interface Wall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
}

export interface Opening {
  id: string;
  wallId: string;
  x: number;
  y: number;
  width: number;
}

export interface FurnitureItem {
  id: string;
  type: FurnitureType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  label?: string;
  catalogId?: string;
}

export type FurnitureType =
  | 'sofa'
  | 'bed'
  | 'desk'
  | 'wardrobe'
  | 'dining_table'
  | 'chair'
  | 'bookshelf'
  | 'tv_stand'
  | 'other';

export interface FurnitureUse {
  role: FurnitureType | 'coffee_table' | 'side_table' | 'vanity' | 'drawer_unit' | 'fridge' | 'washer' | 'air_purifier' | 'rug';
  front?: 'top' | 'bottom';
  clearanceCm?: number;
  allowsFurnitureOnTop?: boolean;
}

export type RoomStyle = 'minimal' | 'nordic' | 'modern' | 'vintage';

export interface RecommendationLayout {
  id: string;
  style: RoomStyle;
  furniture: FurnitureItem[];
  reason: string; // 한국어 설명
  source?: 'ai' | 'adjusted' | 'current';
}
