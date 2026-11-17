import type { FurnitureCategory } from './furniturePreset';
import { appliances, custom, rugs } from './presets/appliancesAndRugs';
import { beds, bookshelves, tvStands, wardrobes } from './presets/bedsAndStorage';
import { chairs, desks, diningTables, livingTables, sofas } from './presets/seatingAndTables';

export type { FurnitureDetail, FurnitureOutline, FurniturePoint, FurniturePreset } from './furniturePreset';

export const furnitureCatalog: readonly FurnitureCategory[] = [
  beds,
  sofas,
  desks,
  wardrobes,
  diningTables,
  livingTables,
  chairs,
  bookshelves,
  tvStands,
  custom,
  appliances,
  rugs,
];
