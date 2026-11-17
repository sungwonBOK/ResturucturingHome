import type { RecommendationLayout, RoomFloorPlan } from '@restructuring-home/domain';
import { createRecommendationSession } from './recommendationSession';

const plan: RoomFloorPlan = { width: 360, height: 480, walls: [], doors: [], windows: [], furniture: [] };
const results = [
  { id: 'minimal-1', style: 'minimal', furniture: [], reason: '창가를 비운 배치' },
  { id: 'minimal-2', style: 'minimal', furniture: [], reason: '수납을 우선한 배치' },
  { id: 'minimal-3', style: 'minimal', furniture: [], reason: '휴식 공간을 넓힌 배치' },
] as RecommendationLayout[];
const session = createRecommendationSession();

const firstRequest = session.begin('draft-1', plan, 'minimal');
assertEqual(session.complete('draft-1', firstRequest, results, plan), true, 'stores latest result');
assertEqual(session.get('draft-1')?.recommendation, results[0], 'stores only the selected kind representative diagram');

const updatedPlan = { ...plan, width: 420 };
const secondRequest = session.begin('draft-1', updatedPlan, 'modern');
assertEqual(session.get('draft-1')?.recommendation, undefined, 'clears old result for changed plan');
assertEqual(session.complete('draft-1', firstRequest, results, updatedPlan), false, 'rejects stale result');
assertEqual(session.complete('draft-1', secondRequest, results, { ...updatedPlan, width: 430 }), false, 'rejects a result after editing the draft');
assertEqual(secondRequest > firstRequest, true, 'increments request version');

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}
