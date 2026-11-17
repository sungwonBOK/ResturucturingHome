import { getFurnitureCatalogItem, getFurniturePreset } from './getFurnitureCatalogItem';
import { furnitureCatalog } from './furnitureCatalog';
import { addFurniture, resizeFurniture, setFurnitureDimensions } from '../model/furnitureEditing';
import { getFloorPlanCanvasGeometry } from '../../room-editor/floorPlanCanvasGeometry';
import { getFurnitureInteractionAtPoint } from '../model/furnitureCanvasInteraction';

const sofa = getFurnitureCatalogItem('sofa');
const other = getFurnitureCatalogItem('other');

assertEqual(sofa.label, '소파', 'reads a catalog label');
assertEqual(other.width, 100, 'reads a catalog size');

const presetIds = furnitureCatalog.flatMap((category) => category.presets.map((preset) => preset.id));
assertEqual(new Set(presetIds).size, presetIds.length, 'every selectable preset has a unique saved id');
assertEqual(getFurniturePreset('other').id, 'custom-rectangle', 'older custom furniture keeps its generic default');
assertEqual(getFurniturePreset('other', 'appliance-washer').material, 'whiteMetal', 'appliances resolve to a distinct finish');
assertEqual(getFurniturePreset('sofa', 'sofa-straight').material, 'wovenFabric', 'sofa uses a fabric finish');
assertEqual(getFurniturePreset('dining_table', 'coffee-table-round').outline.kind, 'circle', 'round coffee table keeps a circular footprint');

const room = { width: 500, height: 500, walls: [], doors: [], windows: [], furniture: [] };
const round = addFurniture(room, 'dining_table', 'round', 'dining-table-round');
assertEqual(round.furniture[0].catalogId, 'dining-table-round', 'records the selected catalog preset');
assertEqual(round.furniture[0].width, 100, 'round table uses preset dimensions');
const resized = resizeFurniture(round, 'round', 120, 100);
assertEqual(resized.furniture[0].height, 120, 'round table stays circular when resized');
const measuredRound = setFurnitureDimensions(round, 'round', 113.5, 113.5);
assertEqual(measuredRound.furniture[0].width, 113.5, 'keeps the measured diameter');
assertEqual(measuredRound.furniture[0].catalogId, 'dining-table-round', 'keeps the selected preset when editing measurements');

const corner = addFurniture(room, 'sofa', 'corner', 'sofa-chaise-left');
const [outline] = getFloorPlanCanvasGeometry(corner, 500, 500).furniture;
assertEqual(getFurnitureInteractionAtPoint([outline], undefined, outline.x + 10, outline.y + outline.height - 10)?.kind, 'move', 'the chaise can be selected');
assertEqual(getFurnitureInteractionAtPoint([outline], undefined, outline.x + outline.width - 10, outline.y + outline.height - 10), undefined, 'empty corner does not capture a furniture tap');

const layeredPlan = addFurniture(round, 'other', 'rug', 'rug-rectangle');
const layeredFurniture = getFloorPlanCanvasGeometry(layeredPlan, 500, 500).furniture;
assertEqual(layeredFurniture[0].id, 'rug', 'floor coverings render underneath furniture regardless of addition order');
assertEqual(getFurnitureInteractionAtPoint(layeredFurniture, undefined, 250, 250)?.furnitureId, 'round', 'furniture above a rug receives the touch');

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}
