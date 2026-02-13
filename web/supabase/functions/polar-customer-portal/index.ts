import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const polarAccessToken = Deno.env.get("POLAR_ACCESS_TOKEN") ?? "";
const polarApiBase = Deno.env.get("POLAR_API_BASE_URL") ?? "https://api.polar.sh";

const supabase = createClient(supabaseUrl, serviceRoleKey);

Deno.serve(async (req: Request) => {
  console.log("polar-customer-portal invoked", req.method);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jwt = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !authData?.user) {
      console.error("Unauthorized user", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!polarAccessToken) {
      console.error("POLAR_ACCESS_TOKEN is not configured");
      return new Response(JSON.stringify({ error: "POLAR_ACCESS_TOKEN is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const returnUrl =
      typeof body?.returnUrl === "string" && body.returnUrl.length > 0
        ? body.returnUrl
        : `${new URL(req.url).origin}/`;

    const { data: licenseRows, error: licenseError } = await supabase
      .from("licenses")
      .select("polar_customer_id,user_email,created_at")
      .eq("user_id", authData.user.id)
      .not("polar_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (licenseError) throw licenseError;

    const latestLicense = licenseRows?.[0];
    if (!latestLicense?.polar_customer_id) {
      console.error("No Polar customer found for user", authData.user.id);
      return new Response(
        JSON.stringify({
          error: "No Polar customer found for this account. Please contact support.",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const requestBodies = [
      { customer_id: latestLicense.polar_customer_id, return_url: returnUrl },
      { customerId: latestLicense.polar_customer_id, returnUrl },
    ];

    let polarJson: Record<string, unknown> = {};
    let polarStatus = 500;
    let created = false;

    for (const bodyPayload of requestBodies) {
      const polarRes = await fetch(`${polarApiBase}/v1/customer-sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${polarAccessToken}`,
        },
        body: JSON.stringify(bodyPayload),
      });

      polarStatus = polarRes.status;
      polarJson = await polarRes.json().catch(() => ({}));
      if (polarRes.ok) {
        created = true;
        break;
      }
    }

    if (!created) {
      console.error("Failed to create customer session", polarStatus, polarJson);
      return new Response(JSON.stringify({ error: polarJson?.detail ?? polarJson?.error ?? "Failed to create customer session" }), {
        status: polarStatus,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        portalUrl: polarJson?.customer_portal_url ?? polarJson?.url ?? null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    console.error("Unhandled error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
