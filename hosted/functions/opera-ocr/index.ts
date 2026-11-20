// @last-edited: 2026-11-19 UTC+7.
// @title: opera-ocr — one image in, its text out.
// @state: the endpoint the read reaches when neither ax/dom nor a canvas selection mirror could answer; a device token or a user Bearer authenticates; nothing is stored and nothing echoes the image back.
// @dependencies: edge-runtime, supabase-js, cors.

import "@supabase/edge-runtime";
import { createClient } from "@supabase/supabase-js";
import { CORS_DEFAULT_ORIGINS, resolveAllowedOrigin } from "../_shared/cors.ts";
import { requiredEnv } from "../_shared/required-env.ts";
import { tokenFromHeaders } from "../_shared/legacy-auth.ts";

const SUPABASE_URL = requiredEnv("SUPABASE_URL");
const SERVICE_ROLE_KEY = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") || "";
const GROQ_MODEL = Deno.env.get("GROQ_OCR_MODEL") || "meta-llama/llama-4-scout-17b-16e-instruct";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const cors = {
  "Access-Control-Allow-Headers": "x-opera-token, x-navego-token, authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store"
};

function json(req: Request, data: unknown, status = 200): Response {
  const origin = resolveAllowedOrigin(req, CORS_DEFAULT_ORIGINS);
  const headers: Record<string, string> = { ...cors, "Content-Type": "application/json; charset=utf-8" };
  if (origin !== null) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(data), { status, headers });
}

async function tokenHash(value: string) {
  const bytes = new TextEncoder().encode(value.toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function deviceFromToken(token: string): Promise<{ id: string } | null> {
  if (!/^[a-f0-9]{64}$/i.test(token)) return null;
  const hash = await tokenHash(token);
  const { data } = await supabase.from("opera_devices").select("id").eq("token_hash", hash).neq("status", "disabled").limit(1);
  const device = Array.isArray(data) && data[0] && typeof (data[0] as { id?: unknown }).id === "string" ? (data[0] as { id: string }) : null;
  return device;
}

async function userFromBearer(header: string | null): Promise<{ id: string } | null> {
  if (!header || !header.startsWith("Bearer ")) return null;
  const jwt = header.slice(7).trim();
  if (!jwt) return null;
  const { data, error } = await supabase.auth.getUser(jwt);
  if (error || !data?.user?.id) return null;
  return { id: data.user.id };
}

async function principal(req: Request): Promise<{ id: string; kind: string } | null> {
  const token = tokenFromHeaders(req.headers);
  if (token) {
    const device = await deviceFromToken(token.trim());
    if (device) return { id: device.id, kind: "device" };
  }
  const user = await userFromBearer(req.headers.get("authorization"));
  return user ? { id: user.id, kind: "user" } : null;
}

const MAX_IMAGE_BASE64 = 6_000_000;

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return json(req, {}, 204);
  if (req.method !== "POST") return json(req, { ok: false, error: "method not allowed" }, 405);

  const who = await principal(req);
  if (!who) return json(req, { ok: false, error: "unauthorized" }, 401);

  if (!GROQ_API_KEY) {
    return json(req, { ok: false, error: "ocr is not configured" }, 503);
  }

  let body: { image_base64?: unknown; mime?: unknown } | null = null;
  try { body = await req.json(); } catch { return json(req, { ok: false, error: "body must be JSON" }, 400); }

  const image = typeof body?.image_base64 === "string" ? body.image_base64.replace(/\s/g, "") : "";
  if (image.length < 100 || image.length > MAX_IMAGE_BASE64) {
    return json(req, { ok: false, error: "image_base64 must be between 100 and 6,000,000 characters" }, 400);
  }
  const mime = typeof body?.mime === "string" && /^image\/(jpeg|png|webp)$/.test(body.mime) ? body.mime : "image/jpeg";

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Return only the text visible in this image, exactly as written, as one block, no commentary, no quotation marks. If there is no readable text, answer with: (none)" },
          { type: "image_url", image_url: { url: `data:${mime};base64,${image}` } }
        ]
      }],
      temperature: 0,
      max_completion_tokens: 2000
    })
  });

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    return json(req, { ok: false, error: `ocr refused: http ${response.status} ${detail}` }, 502);
  }

  const reply = await response.json().catch(() => null) as { choices?: Array<{ message?: { content?: unknown } }> } | null;
  const content = reply?.choices?.[0]?.message?.content;
  const text = typeof content === "string" ? content.trim() : "";
  if (text === "" || text === "(none)") {
    return json(req, { ok: true, text: "" });
  }
  return json(req, { ok: true, text });
});
