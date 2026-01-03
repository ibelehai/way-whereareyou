import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

type TimeFilter = "today" | "month" | "all";
type HeatMode = "stories" | "people";

function jsonResponse(
  body: Record<string, unknown>,
  init?: ResponseInit
): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  });
}

function getStartDate(filter: TimeFilter): string | null {
  const now = new Date();
  if (filter === "today") {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return startOfDay.toISOString();
  }
  if (filter === "month") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return startOfMonth.toISOString();
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  let payload: { timeFilter?: TimeFilter; profileSlug?: string; mode?: HeatMode } = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const timeFilter: TimeFilter = payload.timeFilter ?? "all";
  const profileSlug = (payload.profileSlug ?? "public").trim().toLowerCase();
  const mode: HeatMode = payload.mode ?? "stories";
  const startDate = getStartDate(timeFilter);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("slug", profileSlug)
    .maybeSingle();

  if (profileError) {
    console.error("get-country-heat profile lookup error", profileError);
    return jsonResponse({ success: false, error: "Failed to resolve profile" }, { status: 500 });
  }

  if (!profile) {
    return jsonResponse({ success: false, error: "Profile not found" }, { status: 404 });
  }

  const column = mode === "people" ? "author_country_code" : "country_code";

  let query = supabase
    .from("stories")
    .select(`${column}, created_at`)
    .eq("profile_id", profile.id)
    .limit(5000);

  if (startDate) {
    query = query.gte("created_at", startDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error("get-country-heat error", error);
    return jsonResponse({ success: false, error: "Failed to load heat data" }, { status: 500 });
  }

  const counts = (data || []).reduce((acc, row) => {
    const code = (row[column] || "").toUpperCase();
    if (!code) return acc;
    acc[code] = (acc[code] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const heat = Object.entries(counts).map(([country_code, count]) => ({
    country_code,
    count
  }));

  return jsonResponse({ success: true, heat });
});
