import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 20; // per IP
const ipAttempts = new Map<string, number[]>();

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

type SubmitStoryPayload = {
  accessCode: string;
  countryCode: string;
  countryName: string;
  authorCountryCode?: string;
  authorCountryName?: string;
  authorName: string;
  authorAge?: number | null;
  story?: string | null;
  photoUrl?: string | null;
};

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

function rateLimited(ip: string | null) {
  if (!ip) return false;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const arr = ipAttempts.get(ip) || [];
  const recent = arr.filter((ts) => ts >= windowStart);
  recent.push(now);
  ipAttempts.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX_ATTEMPTS;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip");
  if (rateLimited(ip)) {
    return jsonResponse({ success: false, error: "Too many attempts. Please try again shortly." }, { status: 429 });
  }

  let payload: SubmitStoryPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    accessCode,
    countryCode,
    countryName,
    authorCountryCode,
    authorCountryName,
    authorName,
    authorAge,
    story,
    photoUrl
  } = payload;

  if (!accessCode || !countryCode || !countryName || !authorName) {
    return jsonResponse({ success: false, error: "Missing required fields" }, { status: 400 });
  }

  const normalizedCode = accessCode.trim().toUpperCase();

  if (authorAge !== undefined && authorAge !== null) {
    if (!Number.isInteger(authorAge) || authorAge < 13 || authorAge > 100) {
      return jsonResponse({ success: false, error: "Age must be between 13 and 100 when provided" }, { status: 400 });
    }
  }

  const authorCode = (authorCountryCode || countryCode).toUpperCase();
  const authorNameFallback = authorCountryName || countryName;

  try {
    // Resolve profile slug from URL path /submit-story/{slug}
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const submitIndex = parts.findIndex((p) => p === "submit-story");
    const slugPart = submitIndex >= 0 && parts.length > submitIndex + 1 ? parts[submitIndex + 1] : "public";
    const normalizedSlug = decodeURIComponent(slugPart).toLowerCase();

    const { data, error } = await supabase.rpc("submit_story_atomic", {
      p_slug: normalizedSlug,
      p_code: normalizedCode,
      p_country_code: countryCode.toUpperCase(),
      p_country_name: countryName,
      p_author_country_code: authorCode,
      p_author_country_name: authorNameFallback,
      p_author_name: authorName,
      p_author_age: authorAge ?? null,
      p_story: story ?? null,
      p_photo_url: photoUrl ?? null
    });

    if (error) throw error;
    if (!data) {
      throw new Error("No response from submit_story_atomic");
    }

    const success = (data as Record<string, unknown>).success;
    if (!success) {
      const errorMessage = (data as Record<string, unknown>).error || "Failed to submit story";
      return jsonResponse({ success: false, error: errorMessage }, { status: 400 });
    }

    return jsonResponse(data as Record<string, unknown>);
  } catch (error) {
    console.error("submit-story error", error);
    return jsonResponse(
      { success: false, error: error?.message || "Failed to submit story" },
      { status: 500 }
    );
  }
});
