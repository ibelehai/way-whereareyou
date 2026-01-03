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

function jsonResponse(body: Record<string, unknown>, init?: ResponseInit): Response {
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

  if (req.method !== "GET") {
    return jsonResponse({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.findIndex((p) => p === "get-story");
  const slug = idx >= 0 && parts.length > idx + 1 ? decodeURIComponent(parts[idx + 1]) : null;
  const storyId = idx >= 0 && parts.length > idx + 2 ? parts[idx + 2] : url.searchParams.get("id");

  if (!slug || !storyId) {
    return jsonResponse({ success: false, error: "Missing slug or story id" }, { status: 400 });
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) return jsonResponse({ success: false, error: "Profile not found" }, { status: 404 });

    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("*")
      .eq("id", storyId)
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (storyError) throw storyError;
    if (!story) return jsonResponse({ success: false, error: "Story not found" }, { status: 404 });

    return jsonResponse({ success: true, story });
  } catch (error) {
    console.error("get-story error", error);
    return jsonResponse({ success: false, error: error?.message || "Failed to load story" }, { status: 500 });
  }
});
