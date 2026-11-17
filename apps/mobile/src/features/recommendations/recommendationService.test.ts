import { strict as assert } from 'node:assert';
import type { RecommendationLayout, RoomFloorPlan, RoomStyle } from '@restructuring-home/domain';
import { createRecommendationService } from './recommendationService';
import { validateRecommendationPlacements } from './model/validateRecommendationPlacement';
import { fitsRoom, getFootprint } from '../furniture/model/placementGeometry';

const floorPlan: RoomFloorPlan = {
  width: 360,
  height: 480,
  walls: [
    { id: 'north', x1: 0, y1: 0, x2: 360, y2: 0, thickness: 10 },
    { id: 'east', x1: 360, y1: 0, x2: 360, y2: 480, thickness: 10 },
    { id: 'south', x1: 360, y1: 480, x2: 0, y2: 480, thickness: 10 },
    { id: 'west', x1: 0, y1: 480, x2: 0, y2: 0, thickness: 10 },
  ],
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
  const requestBody = calls[0].body as { floorPlan: RoomFloorPlan; style: RoomStyle; roomInterior: unknown };

  assertEqual(calls[0].name, 'get-recommendations', 'function name');
  assert.deepEqual(requestBody.floorPlan, {
    ...floorPlan,
    furniture: [{ ...floorPlan.furniture[0], use: { role: 'bed', front: 'bottom' } }],
  });
  assertEqual(requestBody.style, 'minimal', 'function style');
  assert.deepEqual(requestBody.roomInterior, [
    { x: 5, y: 5 }, { x: 355, y: 5 }, { x: 355, y: 475 }, { x: 5, y: 475 },
  ], 'sends the usable floor inside the inner wall faces');
  assertEqual(recommendations.length, 2, 'drops a layout missing the original furniture id');
  assertEqual(recommendations[0].style, 'minimal', 'recommendation style');

  const original = { ...floorPlan.furniture[0], id: 'one-bed', catalogId: 'bed-single', label: '싱글 침대', width: 100 };
  const presetRecommendations = await service.request({
    floorPlan: { ...floorPlan, furniture: [original] },
    style: 'minimal',
  });
  const suggestedBed = presetRecommendations[0].furniture[0];
  assertEqual(suggestedBed.catalogId, 'bed-single', 'keeps the preset for the same furniture id');
  assertEqual(suggestedBed.width, 100, 'keeps the original furniture dimensions');

  const corners = [[0, 0], [360, 0], [360, 220], [180, 220], [180, 480], [0, 480]];
  const cornerRoom = { ...floorPlan, furniture: [original], walls: corners.map(([x1, y1], index) => {
    const [x2, y2] = corners[(index + 1) % corners.length];
    return { id: String(index), x1, y1, x2, y2, thickness: 10 };
  }) };
  const [layout] = await createRecommendationService({
    invoke: async () => {
      const candidates = layouts('minimal');
      candidates[0].furniture[0] = { ...original, x: 240, y: 260 };
      candidates[1].furniture[0] = { ...original, x: 60, y: 245 };
      return { data: { recommendations: candidates }, error: null };
    },
  }).request({ floorPlan: cornerRoom, style: 'minimal' });
  assertEqual(layout.id, 'two', 'prefers a valid layout over the first AI result in the cut-out');
  assertEqual(layout.furniture[0].x, 60, 'keeps the valid recommendation location');

  const allOutside = layouts('minimal').map((candidate) => ({
    ...candidate, furniture: [{ ...original, x: 240, y: 260 }],
  }));
  const retryService = createRecommendationService({
    invoke: async () => ({ data: { recommendations: allOutside }, error: null }),
  });
  const [corrected] = await retryService.request({ floorPlan: cornerRoom, style: 'minimal' });
  assertEqual(corrected.furniture[0].id, original.id, 'keeps all of the original furniture when correcting');
  assertEqual(corrected.furniture[0].x, original.x, 'reuses the valid original position when the proposed one is outside');
  assertEqual(corrected.source, 'current', 'identifies the original placement as a fallback');

  await assertRejects(
    () => retryService.request({
      floorPlan: { ...cornerRoom, furniture: [{ ...original, width: 1000 }] }, style: 'minimal',
    }),
    '방 밖에 있는 가구를 방 안으로 옮겨 주세요: 싱글 침대',
  );

  let invokedForOutside = false;
  await assertRejects(
    () => createRecommendationService({
      invoke: async () => { invokedForOutside = true; return { data: null, error: null }; },
    }).request({ floorPlan: { ...cornerRoom, furniture: [{ ...original, x: 240, y: 260 }] }, style: 'minimal' }),
    '방 밖에 있는 가구를 방 안으로 옮겨 주세요: 싱글 침대',
  );
  assert.equal(invokedForOutside, false, 'does not call the AI while furniture sits in the empty notch');

  await assertRejects(
    () => retryService.request({ floorPlan: { ...floorPlan, furniture: [{ ...floorPlan.furniture[0], x: 0 }] }, style: 'minimal' }),
    '방 밖에 있는 가구를 방 안으로 옮겨 주세요: bed-main',
  );

  const failingService = createRecommendationService({
    invoke: async () => ({ data: null, error: { message: 'Function returned 401' } }),
  });

  await assertRejects(
    () => failingService.request({ floorPlan, style: 'minimal' }),
    'AI 추천을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
  );

  const wardrobe = { id: 'wardrobe', type: 'wardrobe', catalogId: 'wardrobe-sliding', x: 20, y: 40, width: 100, height: 60, rotation: 0 } as const;
  const chair = { id: 'chair', type: 'chair', x: 240, y: 230, width: 45, height: 45, rotation: 0 } as const;
  const withDoor = { ...floorPlan, doors: [{ id: 'entry', wallId: 'north', x: 130, y: 0, width: 90 }], furniture: [wardrobe, chair] };
  const fixtures = [
    { id: 'blocks-door', furniture: [{ ...wardrobe, x: 120, y: 5 }, chair] },
    { id: 'blocks-wardrobe', furniture: [wardrobe, { ...chair, x: 30, y: 101 }] },
    { id: 'clear', furniture: [{ ...wardrobe, x: 30 }, chair] },
  ];
  const clearanceService = createRecommendationService({
    invoke: async (_name, { body }) => {
      assert.equal(body.floorPlan.furniture[0].use?.role, 'wardrobe');
      assert.equal(body.floorPlan.furniture[0].use?.front, 'bottom');
      assert.equal(body.floorPlan.furniture[0].catalogId, 'wardrobe-sliding');
      return { data: { recommendations: fixtures.map((layout) => ({ ...layout, style: 'minimal', reason: '추천 배치' })) }, error: null };
    },
  });
  const clear = await clearanceService.request({ floorPlan: withDoor, style: 'minimal' });
  assert.deepEqual(clear.map((layout) => layout.id), ['clear']);

  const blocked = { ...wardrobe, x: 120, y: 5 };
  const fallbackService = createRecommendationService({
    invoke: async () => ({ data: { recommendations: [
      { id: 'blocked', style: 'minimal', reason: '출입구를 비웠어요', furniture: [blocked, chair] },
    ] }, error: null }),
  });
  const [adjusted] = await fallbackService.request({ floorPlan: { ...withDoor, furniture: [blocked, chair] }, style: 'minimal' });
  assert.equal(adjusted.source, 'adjusted');
  assert.notDeepEqual(adjusted.furniture[0], blocked);

  const [current] = await createRecommendationService({
    invoke: async () => ({ data: { recommendations: [] }, error: null }),
  }).request({ floorPlan: withDoor, style: 'minimal' });
  assert.equal(current.source, 'current');
  assert.deepEqual(current.furniture, withDoor.furniture);

  const offsetRoom = {
    ...floorPlan,
    walls: floorPlan.walls.map((wall) => ({ ...wall, x1: wall.x1 + 400, x2: wall.x2 + 400, y1: wall.y1 + 500, y2: wall.y2 + 500 })),
  };
  const [offsetFallback] = validateRecommendationPlacements([], offsetRoom, 'minimal');
  assert.equal(offsetFallback.source, 'adjusted');
  assert.ok(fitsRoom(getFootprint(offsetFallback.furniture[0]),
    offsetRoom.walls.map(({ x1, y1 }) => ({ x: x1, y: y1 })), offsetRoom.walls.map(({ thickness }) => thickness)));

  const sofa = { id: 'sofa', type: 'sofa', x: 40, y: 35, width: 150, height: 80, rotation: 0 } as const;
  const tv = { id: 'tv', type: 'tv_stand', x: 220, y: 35, width: 120, height: 40, rotation: 0 } as const;
  const facingService = createRecommendationService({
    invoke: async () => ({ data: { recommendations: [
      { id: 'beside', style: 'minimal', reason: '옆에 배치', furniture: [sofa, tv] },
      { id: 'facing', style: 'minimal', reason: '마주 보는 배치', furniture: [sofa, { ...tv, x: 55, y: 260, rotation: 180 }] },
    ] }, error: null }),
  });
  const facing = await facingService.request({ floorPlan: { ...floorPlan, furniture: [sofa, tv] }, style: 'minimal' });
  assert.equal(facing[0].id, 'facing');

  const tvOpposite = { ...tv, x: 55, y: 310, rotation: 180 };
  const cabinet = { ...wardrobe, x: 60, y: 155 };
  const sightlineService = createRecommendationService({
    invoke: async () => ({ data: { recommendations: [
      { id: 'blocked-view', style: 'minimal', reason: '시야가 가려진 배치', furniture: [sofa, tvOpposite, cabinet] },
      { id: 'clear-view', style: 'minimal', reason: '시야가 트인 배치', furniture: [sofa, { ...tvOpposite, x: 85 }, { ...cabinet, x: 220 }] },
    ] }, error: null }),
  });
  const sightlines = await sightlineService.request({ floorPlan: { ...floorPlan, furniture: [sofa, tv, cabinet] }, style: 'minimal' });
  assert.deepEqual(sightlines.map(({ id }) => id), ['clear-view', 'blocked-view']);

  const desk = { id: 'desk', type: 'desk', x: 80, y: 45, width: 120, height: 60, rotation: 0 } as const;
  const pairedChair = { ...chair, x: 117.5, y: 120, rotation: 180 };
  const detached = { ...chair, x: 275, y: 300 };
  const movedDesk = { ...desk, x: 140, y: 200 };
  const movedChair = { ...pairedChair, x: 177.5, y: 275 };
  const deskPlan = { ...floorPlan, furniture: [desk, pairedChair] };

  for (const style of ['minimal', 'modern', 'nordic'] as const) {
    const kept = { id: 'keeps-pair', style, reason: '책상과 의자를 함께 옮겼어요.', furniture: [movedDesk, movedChair] };
    const broken = { ...kept, id: 'detaches-chair', furniture: [movedDesk, detached] };
    const reversed = { ...kept, id: 'faces-away', furniture: [movedDesk, { ...movedChair, rotation: 0 }] };
    const seatingService = createRecommendationService({
      invoke: async () => ({ data: { recommendations: [broken, reversed, kept] }, error: null }),
    });
    const results = await seatingService.request({ floorPlan: deskPlan, style });
    assert.deepEqual(results.map(({ id }) => id), [kept.id], `${style} keeps a clear chair and desk pair`);

    const [fallback] = await createRecommendationService({
      invoke: async () => ({ data: { recommendations: [broken] }, error: null }),
    }).request({ floorPlan: deskPlan, style });
    assert.equal(fallback.source, 'current', `${style} fallback avoids separating the pair`);

    const withUnpairedChair = { ...deskPlan, furniture: [desk, detached] };
    const independent = await seatingService.request({ floorPlan: withUnpairedChair, style });
    assert.ok(independent.some(({ id }) => id === broken.id), `${style} allows an independent chair to stay separate`);
  }

  const turnedDesk = { ...desk, x: 130, y: 185, rotation: 90 };
  const turnedChair = { ...pairedChair, x: 100, y: 192.5, rotation: 270 };
  const table = { id: 'table', type: 'dining_table', x: 90, y: 195, width: 50, height: 40, rotation: 0 } as const;
  const turned = { id: 'turned-pair', style: 'modern', reason: '책상 방향을 바꿨어요.', furniture: [turnedDesk, turnedChair] } as const;
  const [turnedResult] = await createRecommendationService({
    invoke: async () => ({ data: { recommendations: [turned] }, error: null }),
  }).request({ floorPlan: deskPlan, style: 'modern' });
  assert.equal(turnedResult.id, turned.id, 'keeps the pair after rotating both pieces');

  const movedTable = { ...table, x: 235 };
  const tableChair = { ...chair, x: 237.5, y: 245, rotation: 180 };
  const tableCandidates = [
    { id: 'table-pair', style: 'nordic', reason: '식탁과 의자를 함께 옮겼어요.', furniture: [movedTable, tableChair] },
    { id: 'table-pair-broken', style: 'nordic', reason: '의자 옮김', furniture: [movedTable, detached] },
  ];
  const tableResults = await createRecommendationService({
    invoke: async () => ({ data: { recommendations: tableCandidates }, error: null }),
  }).request({ floorPlan: { ...floorPlan, furniture: [table, { ...tableChair, x: 92.5 }] }, style: 'nordic' });
  assert.deepEqual(tableResults.map(({ id }) => id), ['table-pair']);
}

function layouts(style: RoomStyle): RecommendationLayout[] {
  return ['one', 'two', 'three'].map((id) => ({
    id,
    style,
    reason: '침대와 책상을 동선에 맞춰 배치합니다.',
    furniture: [{ id: id === 'one' ? 'one-bed' : 'bed-main', type: 'bed', x: 20, y: 40, width: 150, height: 200, rotation: 0 }],
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
