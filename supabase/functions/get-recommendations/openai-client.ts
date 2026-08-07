export interface OpenAIRecommendationRequest {
  floorPlan: unknown;
  style: 'minimal' | 'nordic' | 'modern' | 'vintage';
  screenshotUrl?: string;
}

export interface OpenAIRecommendationClient {
  recommend(request: OpenAIRecommendationRequest): Promise<unknown>;
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
      const response = await options.fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          instructions: buildInstructions(),
          input: [
            {
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: JSON.stringify({ floorPlan: request.floorPlan, style: request.style }),
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

function buildInstructions(): string {
  return [
    'You are an interior layout assistant for a single room.',
    'Return exactly three practical furniture layouts for the requested style.',
    'Keep every furniture item inside the room dimensions and preserve clearance for doors and windows.',
    'Use centimeters for x, y, width, height, and degrees for rotation.',
    'Write each reason in Korean.',
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
              required: ['id', 'type', 'x', 'y', 'width', 'height', 'rotation'],
              properties: {
                id: { type: 'string' },
                type: {
                  type: 'string',
                  enum: [
                    'sofa',
                    'bed',
                    'desk',
                    'wardrobe',
                    'dining_table',
                    'chair',
                    'bookshelf',
                    'tv_stand',
                    'other',
                  ],
                },
                x: { type: 'number' },
                y: { type: 'number' },
                width: { type: 'number' },
                height: { type: 'number' },
                rotation: { type: 'number' },
              },
            },
          },
        },
      },
    },
  },
};
