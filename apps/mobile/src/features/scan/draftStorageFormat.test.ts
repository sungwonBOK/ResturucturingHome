import { strict as assert } from 'node:assert';
import { fixtureScanResult, fixtureScanResultAdapter } from './scanDraft';
import { parseStoredDraft, serializeDraft } from './draftStorageFormat';

const plan = fixtureScanResultAdapter.toRoomFloorPlan(fixtureScanResult);
const stored = serializeDraft({ id: 'draft-a', plan });

assert.deepEqual(parseStoredDraft(stored), { id: 'draft-a', plan }, 'round-trips a valid draft');
assert.equal(parseStoredDraft(null), undefined, 'nothing stored');
assert.equal(parseStoredDraft('{not json'), undefined, 'corrupted JSON is discarded');
assert.equal(parseStoredDraft(JSON.stringify({ version: 99, draft: { id: 'x', plan } })), undefined, 'unknown version is discarded');

const brokenFurniture = { ...plan, furniture: [{ ...plan.furniture[0], width: null }] };
assert.equal(parseStoredDraft(serializeDraft({ id: 'draft-b', plan: brokenFurniture as never })), undefined,
  'furniture with broken numbers is discarded');

const openWalls = { ...plan, walls: plan.walls.slice(0, 2) };
assert.equal(parseStoredDraft(serializeDraft({ id: 'draft-c', plan: openWalls })), undefined, 'an open outline is discarded');

const brokenDoor = { ...plan, doors: [{ id: 'door', wallId: 'wall-south', x: 1, y: 1 }] };
assert.equal(parseStoredDraft(serializeDraft({ id: 'draft-d', plan: brokenDoor as never })), undefined,
  'openings without a width are discarded');
