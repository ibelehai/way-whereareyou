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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  let payload: { countryCode?: string; profileSlug?: string; mode?: "stories" | "people"; page?: number; perPage?: number; sort?: "newest" | "oldest" } = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const countryCode = payload.countryCode?.toUpperCase();
  const profileSlug = (payload.profileSlug ?? "public").trim().toLowerCase();
  const mode = payload.mode ?? "stories";
  const sort = payload.sort === "oldest" ? "oldest" : "newest";
  const perPage = Math.min(Math.max(payload.perPage ?? 20, 1), 20);
  const page = Math.max(payload.page ?? 1, 1);
  const offset = (page - 1) * perPage;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("slug", profileSlug)
    .maybeSingle();

  if (profileError) {
    console.error("get-stories profile lookup error", profileError);
    return jsonResponse({ success: false, error: "Failed to resolve profile" }, { status: 500 });
  }

  if (!profile) {
    return jsonResponse({ success: false, error: "Profile not found" }, { status: 404 });
  }

  const column = mode === "people" ? "author_country_code" : "country_code";

  let query = supabase
    .from("stories")
    .select("*", { count: "exact" })
    .eq("profile_id", profile.id);

  if (countryCode) {
    query = query.eq(column, countryCode);
  }

  query = query.order("created_at", { ascending: sort === "oldest" });

  const { data, error, count } = await query.range(offset, offset + perPage - 1);

  if (error) {
    console.error("get-stories error", error);
    return jsonResponse({ success: false, error: "Failed to load stories" }, { status: 500 });
  }

  return jsonResponse({ success: true, stories: data || [], total: count ?? 0 });
});
