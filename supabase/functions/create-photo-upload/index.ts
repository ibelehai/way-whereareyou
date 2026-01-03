import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const BUCKET = "story-photos";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 20;
const ipAttempts = new Map<string, number[]>();

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

type Payload = {
  fileName?: string;
  contentType?: string;
  size?: number;
  profileSlug?: string;
  accessCode?: string;
};

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

function sanitizeSlug(slug?: string) {
  const cleaned = (slug || "public").toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const trimmed = cleaned.replace(/-+/g, "-").replace(/^-|-$/g, "");
  return trimmed || "public";
}

function inferExtension(fileName?: string, contentType?: string) {
  if (fileName && fileName.includes(".")) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext) return ext;
  }
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip");
  if (ip) {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    const arr = ipAttempts.get(ip) || [];
    const recent = arr.filter((ts) => ts >= windowStart);
    recent.push(now);
    ipAttempts.set(ip, recent);
    if (recent.length > RATE_LIMIT_MAX_ATTEMPTS) {
      return jsonResponse({ success: false, error: "Too many attempts. Please try again shortly." }, { status: 429 });
    }
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { fileName, contentType, size, profileSlug, accessCode } = payload;
  const normalizedType = (contentType || "").toLowerCase();

  if (!accessCode || !accessCode.trim()) {
    return jsonResponse({ success: false, error: "Access code is required" }, { status: 400 });
  }

  if (!normalizedType || !ALLOWED_TYPES.has(normalizedType)) {
    return jsonResponse({ success: false, error: "Only JPEG, PNG, or WebP images are allowed" }, { status: 400 });
  }

  if (!size || size <= 0 || size > MAX_SIZE) {
    return jsonResponse({ success: false, error: "Image too large (max 5MB)" }, { status: 400 });
  }

  const slug = sanitizeSlug(profileSlug);
  const normalizedCode = accessCode.trim().toUpperCase();
  const ext = inferExtension(fileName, normalizedType);
  const uniqueName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const path = `${slug}/${uniqueName}`;

  try {
    // Resolve profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) {
      return jsonResponse({ success: false, error: "Profile not found" }, { status: 404 });
    }

    // Validate access code without incrementing usage
    const { data: codeRecord, error: codeError } = await supabase
      .from("access_codes")
      .select("is_active, usage_limit, usage_count, expires_at")
      .eq("code", normalizedCode)
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (codeError) throw codeError;
    if (!codeRecord) {
      return jsonResponse({ success: false, error: "Invalid access code" }, { status: 400 });
    }
    if (!codeRecord.is_active) {
      return jsonResponse({ success: false, error: "Access code is disabled" }, { status: 400 });
    }
    if (codeRecord.expires_at && new Date(codeRecord.expires_at) < new Date()) {
      return jsonResponse({ success: false, error: "Access code has expired" }, { status: 400 });
    }
    if (
      codeRecord.usage_limit !== null &&
      codeRecord.usage_limit !== undefined &&
      codeRecord.usage_count >= codeRecord.usage_limit
    ) {
      return jsonResponse({ success: false, error: "Access code usage limit reached" }, { status: 400 });
    }

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path, 60, { contentType: normalizedType });

    if (error || !data?.signedUrl || !data?.token) {
      throw error || new Error("Failed to create signed upload URL");
    }

    return jsonResponse({
      success: true,
      path,
      signedUrl: data.signedUrl,
      token: data.token,
      expiresIn: 60
    });
  } catch (error) {
    console.error("create-photo-upload error", error);
    return jsonResponse({ success: false, error: error?.message || "Failed to prepare upload" }, { status: 500 });
  }
});
