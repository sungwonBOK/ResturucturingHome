import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {
  RecommendationContractError,
  parseRecommendationLayouts,
  parseRecommendationRequest,
} from './contracts.ts';
import {
  OpenAIRecommendationError,
  createOpenAIRecommendationClient,
} from './openai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ message: 'POST 요청만 지원합니다.' }, 405);
  }

  try {
    const payload = await request.json();
    const recommendationRequest = parseRecommendationRequest(payload);
    const apiKey = Deno.env.get('OPENAI_API_KEY') ?? '';

    if (!apiKey) {
      return jsonResponse({ message: 'AI 추천 서비스가 아직 설정되지 않았습니다.' }, 500);
    }

    const client = createOpenAIRecommendationClient({ apiKey, fetch });
    const modelResponse = await client.recommend(recommendationRequest);
    const recommendations = parseRecommendationLayouts(modelResponse, recommendationRequest.style);

    return jsonResponse({ recommendations }, 200);
  } catch (error) {
    if (error instanceof RecommendationContractError) {
      return jsonResponse({ message: error.message }, 400);
    }

    if (error instanceof OpenAIRecommendationError) {
      return jsonResponse({ message: error.message }, 502);
    }

    return jsonResponse({ message: '추천 요청을 처리하지 못했습니다.' }, 500);
  }
});

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
