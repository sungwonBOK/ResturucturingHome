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
    { id: 'bed-main', type: 'bed', x: 20, y: 40, width: 150, height: 200, rotation: 0, catalogId: 'bed-single', use: { role: 'bed' } },
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
  assertEqual(request.floorPlan.furniture[0].catalogId, 'bed-single', 'catalog selection reaches the model');
  assertEqual(request.floorPlan.furniture[0].use?.role, 'bed', 'furniture use reaches the model');
  assertEqual(request.roomInterior, undefined, 'room interior is optional');

  const interior = [{ x: 5, y: 5 }, { x: 355, y: 5 }, { x: 355, y: 475 }];
  const withInterior = parseRecommendationRequest({ floorPlan, style: 'minimal', roomInterior: interior });
  assertEqual(withInterior.roomInterior?.length, 3, 'room interior reaches the model');
  assertContractError(
    () => parseRecommendationRequest({ floorPlan, style: 'minimal', roomInterior: [{ x: 5, y: 5 }] }),
    'room interior needs at least three points',
  );

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
    request,
  );

  assertEqual(layouts.length, 2, 'rejects only the candidate with an unknown furniture id');
  assertEqual(layouts[0].furniture[0].type, 'bed', 'layout furniture type');
  assertEqual(layouts[0].furniture[0].width, 150, 'output uses original dimensions');
  assertEqual(layouts[0].furniture[0].x, 25, 'converts model center x to the editor position');
  assertEqual(layouts[0].furniture[0].y, 40, 'converts model center y to the editor position');
  assertEqual(layouts[0].furniture[0].rotation, 345, 'normalizes rotation to positive degrees');
  assertContractError(
    () => parseRecommendationLayouts({ recommendations: [layout('layout-1'), layout('layout-2')] }, request),
    'three layouts are required',
  );
}

function layout(id: string) {
  return {
    id,
    style: 'minimal',
    reason: '침대와 책상을 동선에 맞춰 배치합니다.',
    furniture: [
      { id: id === 'layout-2' ? 'unknown-bed' : 'bed-main', x: 100, y: 140, rotation: -15 },
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
