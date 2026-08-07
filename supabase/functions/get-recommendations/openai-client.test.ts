import {
  createOpenAIRecommendationClient,
  type OpenAIRecommendationRequest,
} from './openai-client';

const request = {
  floorPlan: {
    width: 360,
    height: 480,
    walls: [{ id: 'wall-north', x1: 0, y1: 0, x2: 360, y2: 0, thickness: 10 }],
    doors: [],
    windows: [],
    furniture: [{ id: 'bed-main', type: 'bed', x: 20, y: 40, width: 150, height: 200, rotation: 0 }],
  },
  style: 'minimal',
} satisfies OpenAIRecommendationRequest;

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
    input: Array<{ content: Array<{ type: string }> }>;
  };

  assertEqual(calls[0].init?.headers && (calls[0].init.headers as Record<string, string>).Authorization, 'Bearer server-secret', 'server authorization');
  assertEqual(firstBody.model, 'gpt-4o', 'model');
  assertEqual(firstBody.input[0].content.some((part) => part.type === 'input_image'), false, 'no image input');
  assertEqual(recommendationResponse.recommendations.length, 3, 'recommendation count');

  await client.recommend({ ...request, screenshotUrl: 'https://example.com/room.png' });

  const secondBody = JSON.parse(String(calls[1].init?.body)) as {
    input: Array<{ content: Array<{ type: string; image_url?: string }> }>;
  };
  const image = secondBody.input[0].content.find((part) => part.type === 'input_image');

  assertEqual(image?.image_url, 'https://example.com/room.png', 'image input URL');
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
    furniture: [{ id: `${id}-bed`, type: 'bed', x: 20, y: 40, width: 150, height: 200, rotation: 0 }],
  };
}

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

void run();
