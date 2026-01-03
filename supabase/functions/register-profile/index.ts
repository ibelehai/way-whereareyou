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

type Payload = {
  slug: string;
  name: string;
  email: string;
  password: string;
  country?: string;
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

function isValidSlug(slug: string) {
  return /^[a-z0-9-]{3,30}$/.test(slug);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const slug = (payload.slug || "").trim().toLowerCase();
  const name = (payload.name || "").trim();
  const email = (payload.email || "").trim().toLowerCase();
  const password = payload.password || "";
  const country = (payload.country || "").trim().toUpperCase();

  if (!slug || !name || !email || !password) {
    return jsonResponse({ success: false, error: "Missing required fields" }, { status: 400 });
  }

  if (!isValidSlug(slug)) {
    return jsonResponse({ success: false, error: "Slug must be 3-30 chars, lowercase letters, numbers, or hyphens" }, { status: 400 });
  }

  try {
    // Ensure slug uniqueness
    const { data: existingSlug, error: slugError } = await supabase
      .from("profiles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (slugError) throw slugError;
    if (existingSlug) {
      return jsonResponse({ success: false, error: "Slug already taken" }, { status: 400 });
    }

    // Create auth user
    const { data: userResult, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (createUserError || !userResult?.user) {
      throw createUserError || new Error("Failed to create user");
    }

    const userId = userResult.user.id;

    // Create profile
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        slug,
        name,
        user_id: userId,
        country: country || null
      });

    if (profileError) {
      // Cleanup user to avoid orphaned accounts
      await supabase.auth.admin.deleteUser(userId);
      throw profileError;
    }

    return jsonResponse({ success: true, slug });
  } catch (error) {
    console.error("register-profile error", error);
    return jsonResponse({ success: false, error: error?.message || "Registration failed" }, { status: 500 });
  }
});
