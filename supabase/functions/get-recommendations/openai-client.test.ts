import type { RecommendationRequest } from './contracts';
import { createOpenAIRecommendationClient } from './openai-client';

const request = {
  floorPlan: {
    width: 360,
    height: 480,
    walls: [{ id: 'wall-north', x1: 0, y1: 0, x2: 360, y2: 0, thickness: 10 }],
    doors: [],
    windows: [],
    furniture: [{ id: 'bed-main', type: 'bed', x: 20, y: 40, width: 151, height: 200, rotation: 90 }],
  },
  style: 'minimal',
} satisfies RecommendationRequest;

async function run() {
  const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  const client = createOpenAIRecommendationClient({
    apiKey: 'server-secret',
    fetch: async (input, init) => {
      calls.push({ input, init });

      return new Response(JSON.stringify(responsePayload()), { status: 200 });
    },
  });

  const recommendationResponse = await client.recommend(request) as { recommendations: unknown[] };
  const firstBody = JSON.parse(String(calls[0].init?.body)) as {
    model: string;
    instructions: string;
    input: Array<{ content: Array<{ type: string; text: string }> }>;
    text: { format: { schema: { properties: { recommendations: { items: { properties: {
      furniture: { items: { required: string[] } };
    } } } } } } };
  };

  assertEqual(calls[0].init?.headers && (calls[0].init.headers as Record<string, string>).Authorization, 'Bearer server-secret', 'server authorization');
  assertEqual(firstBody.model, 'gpt-4o', 'model');
  assertEqual(firstBody.instructions.includes('y increases down'), true, 'uses the app coordinate axes');
  assertEqual(firstBody.instructions.includes('wall centerlines'), true, 'explains that wall coordinates are centerlines');
  assertEqual(firstBody.instructions.includes('roomInterior'), true, 'points the model at the usable floor polygon');
  const modelInput: RecommendationRequest = JSON.parse(firstBody.input[0].content[0].text);
  assertEqual(modelInput.style, 'minimal', 'keeps the selected style value');
  assertEqual(modelInput.floorPlan.furniture[0].x, 95.5, 'sends the furniture center x');
  assertEqual(modelInput.floorPlan.furniture[0].y, 140, 'sends the furniture center y');
  assertEqual(modelInput.floorPlan.furniture[0].rotation, 90, 'preserves the input rotation');
  assertEqual(modelInput.floorPlan.walls[0].x1, 0, 'preserves wall endpoints');
  assertEqual(request.floorPlan.furniture[0].x, 20, 'does not mutate the original position');
  assertEqual(firstBody.instructions.includes('furniture center in both input and output'), true, 'specifies the same coordinate origin for both directions');
  assertEqual(firstBody.text.format.schema.properties.recommendations.items.properties.furniture.items.required.join(','),
    'id,x,y,rotation', 'model returns only the furniture id and pose');
  assertEqual(firstBody.input[0].content.some((part) => part.type === 'input_image'), false, 'no image input');
  assertEqual(recommendationResponse.recommendations.length, 3, 'recommendation count');

  await client.recommend({ ...request, screenshotUrl: 'https://example.com/room.png' });

  const secondBody = JSON.parse(String(calls[1].init?.body)) as {
    input: Array<{ content: Array<{ type: string; image_url?: string }> }>;
  };
  const image = secondBody.input[0].content.find((part) => part.type === 'input_image');

  assertEqual(image?.image_url, 'https://example.com/room.png', 'image input URL');

  const priorities = {
    minimal: 'continuous open floor space',
    modern: 'group furniture by activity',
    nordic: 'rest area around an existing sofa or bed',
  } as const;
  for (const style of Object.keys(priorities) as Array<keyof typeof priorities>) {
    await client.recommend({ ...request, style });
    const body = JSON.parse(String(calls.at(-1)?.init?.body)) as { instructions: string };
    for (const [otherStyle, priority] of Object.entries(priorities)) {
      assertEqual(body.instructions.includes(priority), style === otherStyle, `${style} only carries its own priority`);
    }
    assertEqual(body.instructions.includes('already forms a clear pair'), true, `${style} preserves clear chair and table pairs`);
    assertEqual(body.instructions.includes('one concrete placement choice'), true, `${style} asks for a concrete reason`);
    assertEqual(body.instructions.includes('Base the recommendation on the supplied room geometry and furniture'), true, `${style} uses the available room data`);
    assertEqual(/\bwindows?\b/i.test(body.instructions), false, `${style} does not rely on window-specific instructions`);
  }

  await client.recommend({
    ...request,
    style: 'nordic',
    floorPlan: {
      ...request.floorPlan,
      windows: [{ id: 'window-main', wallId: 'wall-north', x: 100, y: 0, width: 120 }],
    },
  });
  const withWindow = JSON.parse(String(calls.at(-1)?.init?.body)) as typeof firstBody;
  const planWithWindow: RecommendationRequest = JSON.parse(withWindow.input[0].content[0].text);
  assertEqual(planWithWindow.floorPlan.windows[0]?.id, 'window-main', 'keeps existing opening data in the floor plan');
  assertEqual(/\bwindows?\b/i.test(withWindow.instructions), false, 'window data does not change the style instructions');

  await client.recommend({ ...request, style: 'vintage' });
  const vintage = JSON.parse(String(calls.at(-1)?.init?.body)) as { instructions: string };
  assertEqual(Object.values(priorities).some((priority) => vintage.instructions.includes(priority)), false, 'vintage keeps its existing generic guidance');
}

function responsePayload() {
  return {
    output: [
      {
        type: 'message',
        content: [
          {
            type: 'output_text',
            text: JSON.stringify({
              recommendations: [layout('layout-1'), layout('layout-2'), layout('layout-3')],
            }),
          },
        ],
      },
    ],
  };
}

function layout(id: string) {
  return {
    id,
    style: 'minimal',
    reason: '침대와 책상을 동선에 맞춰 배치합니다.',
    furniture: [{ id: 'bed-main', x: 95.5, y: 140, rotation: 90 }],
  };
}

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

void run();
