import { mockStudioFloorPlan } from '../../mocks/mockRoomFloorPlan';
import {
  createMemoryScanDraftRepository,
  fixtureScanResult,
  fixtureScanResultAdapter,
  getRoomEditorPlan,
} from './scanDraft';

function run() {
  const repository = createMemoryScanDraftRepository();
  const plan = fixtureScanResultAdapter.toRoomFloorPlan(fixtureScanResult);
  const draft = repository.create(plan);

  assertEqual(plan.width, 420, 'fixture plan width');
  assertEqual(plan.height, 520, 'fixture plan height');
  assertEqual(plan.walls[0].id, 'wall-north', 'fixture north wall');
  assertEqual(draft.id, 'scan-draft-1', 'first draft id');
  assertEqual(repository.get(draft.id), plan, 'stored draft plan');
  assertEqual(
    getRoomEditorPlan(draft.id, repository, mockStudioFloorPlan),
    plan,
    'editor uses matching draft',
  );
  assertEqual(
    getRoomEditorPlan('missing-draft', repository, mockStudioFloorPlan),
    mockStudioFloorPlan,
    'editor falls back for unknown draft',
  );
}

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

run();
