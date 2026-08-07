import {
  RecommendationContractError,
  parseRecommendationLayouts,
  parseRecommendationRequest,
} from './contracts';

const floorPlan = {
  width: 360,
  height: 480,
  walls: [
    { id: 'wall-north', x1: 0, y1: 0, x2: 360, y2: 0, thickness: 10 },
  ],
  doors: [],
  windows: [],
  furniture: [
    { id: 'bed-main', type: 'bed', x: 20, y: 40, width: 150, height: 200, rotation: 0 },
  ],
};

function run() {
  const request = parseRecommendationRequest({
    floorPlan,
    style: 'minimal',
    screenshotUrl: 'https://example.com/room.png',
  });

  assertEqual(request.style, 'minimal', 'selected style');
  assertEqual(request.floorPlan.width, 360, 'floor plan width');
  assertEqual(request.screenshotUrl, 'https://example.com/room.png', 'screenshot URL');

  assertContractError(
    () => parseRecommendationRequest({ floorPlan }),
    'style is required',
  );
  assertContractError(
    () => parseRecommendationRequest({ floorPlan, style: 'minimal', screenshotUrl: 'http://example.com/room.png' }),
    'screenshot URL must use HTTPS',
  );

  const layouts = parseRecommendationLayouts(
    {
      recommendations: [
        layout('layout-1'),
        layout('layout-2'),
        layout('layout-3'),
      ],
    },
    'minimal',
  );

  assertEqual(layouts.length, 3, 'layout count');
  assertEqual(layouts[0].furniture[0].type, 'bed', 'layout furniture type');
  assertContractError(
    () => parseRecommendationLayouts({ recommendations: [layout('layout-1'), layout('layout-2')] }, 'minimal'),
    'three layouts are required',
  );
}

function layout(id: string) {
  return {
    id,
    style: 'minimal',
    reason: '침대와 책상을 동선에 맞춰 배치합니다.',
    furniture: [
      { id: `${id}-bed`, type: 'bed', x: 20, y: 40, width: 150, height: 200, rotation: 0 },
    ],
  };
}

function assertContractError(action: () => unknown, label: string) {
  try {
    action();
  } catch (error) {
    if (error instanceof RecommendationContractError) {
      return;
    }

    throw error;
  }

  throw new Error(`${label}: expected RecommendationContractError`);
}

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

run();
