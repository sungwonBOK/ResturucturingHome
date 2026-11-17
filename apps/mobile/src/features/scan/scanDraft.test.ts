import { strict as assert } from 'node:assert';
import {
  createScanDraftRepository,
  fixtureScanResult,
  fixtureScanResultAdapter,
  type DraftStorage,
} from './scanDraft';

async function run() {
  const plan = fixtureScanResultAdapter.toRoomFloorPlan(fixtureScanResult);
  assert.equal(plan.width, 420, 'fixture plan width');
  assert.equal(plan.walls[0].id, 'wall-north', 'fixture north wall');

  const memory = createScanDraftRepository();
  const draft = memory.create(plan);
  assert.equal(memory.get(draft.id), plan, 'stored draft plan');
  assert.equal(memory.get('missing-draft'), undefined, 'unknown draft');
  assert.notEqual(memory.create(plan).id, draft.id, 'each draft gets its own id');

  const movedFurniture = plan.furniture.map((item) => ({ ...item, x: item.x + 10 }));
  memory.updateFurniture(draft.id, movedFurniture);
  memory.updateOutline(draft.id, { ...plan, width: 500 });
  assert.equal(memory.get(draft.id)?.furniture, movedFurniture, 'outline edits keep the latest furniture');
  assert.equal(memory.get(draft.id)?.width, 500, 'outline edits update the draft width');
  memory.updateFurniture(draft.id, []);
  assert.equal(memory.get(draft.id)?.width, 500, 'furniture edits keep the latest outline');
  assert.equal(memory.getLatestDraftId(), draft.id, 'the last edited draft is the latest');
  assert.equal(memory.updateFurniture('missing-draft', []), undefined, 'does not update a missing draft');

  const storage = createFakeStorage();
  const first = createScanDraftRepository({ storage });
  const saved = first.create(plan);
  first.updateFurniture(saved.id, movedFurniture);
  await first.flush();

  const restarted = createScanDraftRepository({ storage });
  assert.equal(restarted.get(saved.id), undefined, 'nothing is visible before hydration');
  await restarted.hydrate();
  assert.deepEqual(restarted.get(saved.id)?.furniture, movedFurniture, 'restores the latest edit after a restart');
  assert.equal(restarted.getLatestDraftId(), saved.id, 'offers the restored draft to continue');
  assert.notEqual(restarted.create(plan).id, saved.id, 'new drafts never reuse a restored id');

  const corrupted = createScanDraftRepository({ storage: createFakeStorage('{broken') });
  await corrupted.hydrate();
  assert.equal(corrupted.getLatestDraftId(), undefined, 'ignores a corrupted stored draft');

  const unreadable = createScanDraftRepository({ storage: { load: () => Promise.reject(new Error('disk')), save: async () => {} } });
  await unreadable.hydrate();
  assert.equal(unreadable.getLatestDraftId(), undefined, 'a storage read failure starts empty instead of crashing');

  const unwritable = createScanDraftRepository({ storage: { load: async () => null, save: () => Promise.reject(new Error('full')) } });
  const kept = unwritable.create(plan);
  await unwritable.flush();
  assert.equal(unwritable.get(kept.id), plan, 'a storage write failure keeps the in-memory draft');
}

function createFakeStorage(initial: string | null = null): DraftStorage {
  let value = initial;
  return {
    load: async () => value,
    save: async (next) => { value = next; },
  };
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
