import { strict as assert } from 'node:assert';
import type { FurnitureItem } from '@restructuring-home/domain';
import { createAppliedRecommendations } from './appliedRecommendation';

const before: FurnitureItem[] = [{ id: 'bed', type: 'bed', x: 10, y: 10, width: 100, height: 200, rotation: 0 }];
const applied: FurnitureItem[] = [{ ...before[0], x: 200 }];
const history = createAppliedRecommendations();

assert.equal(history.getUndo('draft-a', applied), undefined, 'nothing to undo before applying');

history.record('draft-a', before, applied);
assert.equal(history.getUndo('draft-a', applied), before, 'undo restores the layout from before the recommendation');
assert.equal(history.getUndo('draft-b', applied), undefined, 'undo belongs to its own draft');

const editedAfterApply = [{ ...applied[0], x: 220 }];
assert.equal(history.getUndo('draft-a', editedAfterApply), undefined, 'editing after applying ends the undo so edits are never lost');

history.clear('draft-a');
assert.equal(history.getUndo('draft-a', applied), undefined, 'undo is used once');
