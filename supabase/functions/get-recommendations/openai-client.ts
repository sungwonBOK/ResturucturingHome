import type { RecommendationRequest, RoomStyle } from './contracts.ts';

const styleInstructions: Partial<Record<RoomStyle, string>> = {
  minimal: 'Prioritize continuous open floor space. Where the room shape allows, move bulky furniture toward the edges to keep a clear route between frequently used pieces.',
  modern: 'When the room serves multiple activities, group furniture by activity, such as work or sleep. Place related storage within easy reach where it fits.',
  nordic: 'When possible, create a rest area around an existing sofa or bed away from the main walking route. Include nearby furniture only if it supports that use, and leave room to approach the seat or bed.',
};

export interface OpenAIRecommendationClient {
  recommend(request: RecommendationRequest): Promise<unknown>;
}

export interface OpenAIRecommendationClientOptions {
  apiKey: string;
  fetch: typeof globalThis.fetch;
}

export class OpenAIRecommendationError extends Error {}

export function createOpenAIRecommendationClient(
  options: OpenAIRecommendationClientOptions,
): OpenAIRecommendationClient {
  if (!options.apiKey.trim()) {
    throw new OpenAIRecommendationError('OpenAI API key가 설정되지 않았습니다.');
  }

  return {
    async recommend(request) {
      const floorPlan = {
        ...request.floorPlan,
        furniture: request.floorPlan.furniture.map((item) => ({
          ...item,
          x: item.x + item.width / 2,
          y: item.y + item.height / 2,
        })),
      };
      const response = await options.fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          instructions: buildInstructions(request.style),
          input: [
            {
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: JSON.stringify({
                    floorPlan,
                    ...(request.roomInterior ? { roomInterior: request.roomInterior } : {}),
                    style: request.style,
                  }),
                },
                ...(request.screenshotUrl
                  ? [{ type: 'input_image', image_url: request.screenshotUrl }]
                  : []),
              ],
            },
          ],
          text: {
            format: {
              type: 'json_schema',
              name: 'room_recommendations',
              strict: true,
              schema: recommendationResponseSchema,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new OpenAIRecommendationError('AI 추천 요청에 실패했습니다.');
      }

      const payload = await response.json();
      const text = extractOutputText(payload);

      try {
        return JSON.parse(text);
      } catch {
        throw new OpenAIRecommendationError('AI 추천 결과 형식이 올바르지 않습니다.');
      }
    },
  };
}

function buildInstructions(style: RoomStyle): string {
  return [
    'You are an interior layout assistant for a single room.',
    'Return exactly three practical furniture layouts for the requested style.',
    'Base the recommendation on the supplied room geometry and furniture. Treat unrecorded features as unknown and describe only changes supported by the layout.',
    'The connected wall segments form the actual room boundary. Use their coordinates as given, including any offset from the room origin (0, 0).',
    'Wall coordinates are wall centerlines. Each wall extends half of its thickness to both sides, so furniture can only reach the inner face, not the centerline.',
    'roomInterior, when provided, is the usable floor polygon formed by those inner faces. Keep every rotated furniture footprint fully inside roomInterior, including irregular and concave outlines. To place furniture against a wall, align its edge with the roomInterior edge.',
    'Use every input furniture id exactly once per layout. For each item return only its id, x, y, and rotation. Use its original dimensions to plan the layout.',
    'x increases right and y increases down, in centimeters. Furniture x and y locate the furniture center in both input and output. Rotation is clockwise in degrees around that center.',
    'Each recorded opening starts at (x, y) and extends by its width along the wall toward increasing x for mainly horizontal walls or increasing y for mainly vertical walls. Keep the full span within the wall. For doors in the supplied plan, leave an unobstructed entry as deep as the door width, up to 90 cm, measured from the inner face.',
    'Use the furniture use.role, label and catalogId to understand its purpose. Its use.front is its top or bottom edge before rotation. Leave use.clearanceCm of usable room in front of it. An item with use.allowsFurnitureOnTop can overlap other furniture and its access space.',
    'Prefer sofas facing TV stands with a clear sightline and chairs near the usable side of desks or dining tables. If a chair already forms a clear pair with a work or dining surface in the input layout, keep them together with the chair facing the usable side.',
    'Apply the requested style as a preference among practical arrangements. If the furniture or available space cannot support that preference, prioritize safe access and normal furniture use.',
    ...(styleInstructions[style] ? [styleInstructions[style]] : []),
    'Write each reason in Korean. Explain one concrete placement choice in the returned layout and how it helps. If a position or orientation changed from the input, describe that change.',
  ].join(' ');
}

function extractOutputText(value: unknown): string {
  if (!value || typeof value !== 'object') {
    throw new OpenAIRecommendationError('AI 응답이 비어 있습니다.');
  }

  const output = (value as { output?: unknown }).output;

  if (!Array.isArray(output)) {
    throw new OpenAIRecommendationError('AI 응답 텍스트를 찾을 수 없습니다.');
  }

  for (const item of output) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const content = (item as { content?: unknown }).content;

    if (!Array.isArray(content)) {
      continue;
    }

    for (const part of content) {
      if (
        part &&
        typeof part === 'object' &&
        (part as { type?: unknown }).type === 'output_text' &&
        typeof (part as { text?: unknown }).text === 'string'
      ) {
        return (part as { text: string }).text;
      }
    }
  }

  throw new OpenAIRecommendationError('AI 응답 텍스트를 찾을 수 없습니다.');
}

const recommendationResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['recommendations'],
  properties: {
    recommendations: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'style', 'reason', 'furniture'],
        properties: {
          id: { type: 'string' },
          style: { type: 'string', enum: ['minimal', 'nordic', 'modern', 'vintage'] },
          reason: { type: 'string' },
          furniture: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['id', 'x', 'y', 'rotation'],
              properties: {
                id: { type: 'string' },
                x: { type: 'number' },
                y: { type: 'number' },
                rotation: { type: 'number' },
              },
            },
          },
        },
      },
    },
  },
};
