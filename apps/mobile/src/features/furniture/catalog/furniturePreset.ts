import type { FurnitureType, FurnitureUse } from '@restructuring-home/domain';
import type { FurnitureDetailFinish, FurnitureMaterial } from './furnitureMaterials';

export interface FurniturePoint {
  x: number;
  y: number;
}

export interface FurnitureDetail extends FurniturePoint {
  width: number;
  height: number;
  finish?: FurnitureDetailFinish;
  shape?: 'oval';
}

export type FurnitureOutline =
  | { kind: 'rectangle' }
  | { kind: 'circle' }
  | { kind: 'polygon'; points: readonly FurniturePoint[] };

export interface FurniturePreset {
  id: string;
  label: string;
  width: number;
  height: number;
  outline: FurnitureOutline;
  details: readonly FurnitureDetail[];
  material: FurnitureMaterial;
  allowsCustomName?: boolean;
  allowsFurnitureOnTop?: boolean;
  use?: Omit<FurnitureUse, 'allowsFurnitureOnTop'>;
}

export interface FurnitureCategory {
  id: string;
  type: FurnitureType;
  label: string;
  presets: readonly [FurniturePreset, ...FurniturePreset[]];
}
