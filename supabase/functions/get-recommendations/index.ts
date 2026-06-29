// Edge Function: get-recommendations
// OpenAI GPT-4o를 호출하여 3가지 가구 배치를 반환합니다

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  // TODO: OpenAI 추천 로직 구현
  return new Response(
    JSON.stringify({ message: "get-recommendations placeholder" }),
    { headers: { "Content-Type": "application/json" } }
  );
});
