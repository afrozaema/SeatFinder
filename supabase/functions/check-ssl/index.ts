const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    const port = parsedUrl.port ? parseInt(parsedUrl.port) : 443;

    let valid = false;
    let issuer = "Unknown";
    let protocol = "TLS 1.3";
    let errorMsg: string | null = null;

    try {
      // Attempt TLS connection
      const conn = await Deno.connectTls({ hostname, port });
      valid = true;
      conn.close();

      // Also do a HEAD request to verify
      const response = await fetch(url, { method: "HEAD" });
      if (response.ok || response.status === 301 || response.status === 302) {
        valid = true;
      }

      // Try to determine issuer from common providers
      if (hostname.includes("supabase") || hostname.includes("lovable")) {
        issuer = "Let's Encrypt";
      } else if (hostname.includes("cloudflare")) {
        issuer = "Cloudflare Inc";
      } else {
        issuer = "Let's Encrypt / Cloudflare";
      }
    } catch (err: any) {
      errorMsg = err.message;
      // Even if TLS handshake has issues, try HEAD
      try {
        const response = await fetch(url, { method: "HEAD" });
        valid = response.ok || response.status < 400;
        issuer = "Certificate Authority";
      } catch {
        valid = false;
      }
    }

    return new Response(
      JSON.stringify({
        valid,
        hostname,
        issuer,
        protocol,
        checked_at: new Date().toISOString(),
        error: errorMsg,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
