import type { RecommendationLayout, RoomFloorPlan, RoomStyle } from '@restructuring-home/domain';
import { createRecommendationService } from './recommendationService';

const floorPlan: RoomFloorPlan = {
  width: 360,
  height: 480,
  walls: [{ id: 'wall-north', x1: 0, y1: 0, x2: 360, y2: 0, thickness: 10 }],
  doors: [],
  windows: [],
  furniture: [{ id: 'bed-main', type: 'bed', x: 20, y: 40, width: 150, height: 200, rotation: 0 }],
};

async function run() {
  const calls: Array<{ name: string; body: unknown }> = [];
  const service = createRecommendationService({
    invoke: async (name, options) => {
      calls.push({ name, body: options.body });

      return { data: { recommendations: layouts('minimal') }, error: null };
    },
  });

  const recommendations = await service.request({ floorPlan, style: 'minimal' });
  const requestBody = calls[0].body as { floorPlan: RoomFloorPlan; style: RoomStyle };

  assertEqual(calls[0].name, 'get-recommendations', 'function name');
  assertEqual(requestBody.floorPlan, floorPlan, 'function floor plan');
  assertEqual(requestBody.style, 'minimal', 'function style');
  assertEqual(recommendations.length, 3, 'recommendation count');
  assertEqual(recommendations[0].style, 'minimal', 'recommendation style');

  const failingService = createRecommendationService({
    invoke: async () => ({ data: null, error: { message: 'Function returned 401' } }),
  });

  await assertRejects(
    () => failingService.request({ floorPlan, style: 'minimal' }),
    'AI 추천을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
  );
}

function layouts(style: RoomStyle): RecommendationLayout[] {
  return ['one', 'two', 'three'].map((id) => ({
    id,
    style,
    reason: '침대와 책상을 동선에 맞춰 배치합니다.',
    furniture: [{ id: `${id}-bed`, type: 'bed', x: 20, y: 40, width: 150, height: 200, rotation: 0 }],
  }));
}

async function assertRejects(action: () => Promise<unknown>, expectedMessage: string) {
  try {
    await action();
  } catch (error) {
    if (error instanceof Error && error.message === expectedMessage) {
      return;
    }

    throw error;
  }

  throw new Error(`expected rejection: ${expectedMessage}`);
}

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

void run();
