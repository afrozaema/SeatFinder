import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const start = performance.now();
  let status = "ok";
  let errorMessage: string | null = null;
  let recordCount: number | null = null;

  try {
    const { data, error, count } = await supabase
      .from("site_settings")
      .select("*", { count: "exact" });

    if (error) throw error;
    recordCount = count ?? data?.length ?? 0;
  } catch (err: any) {
    status = "error";
    errorMessage = err.message || "Unknown error";
  }

  const responseTimeMs = Math.round(performance.now() - start);

  // Log the result
  await supabase.from("keep_alive_log").insert({
    status,
    response_time_ms: responseTimeMs,
    error_message: errorMessage,
    record_count: recordCount,
  });

  return new Response(
    JSON.stringify({ status, response_time_ms: responseTimeMs, error_message: errorMessage, record_count: recordCount }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
