// @last-edited: 2026-11-15 UTC+7.
// @title: navego-feedback â€” the pilot page's answers, written down so the first customers are not a memory.
// @state: takes one answer from the pilot page, keeps the newest answer per contact, and answers with what it did.
// @dependencies: edge-runtime, supabase-js, cors, required-env.

// THIS FUNCTION EXISTS.
// The pilot page asks three questions - which portal, how many clients, what wears them out - and the answers decide which bank gets built first.
// An answer that lives in a form service's dashboard is an answer that disappears with that service, so the answers belong to the product's own database, next to the price list and the invoices they turn into.

// THE PAGE MAY POST WITHOUT A TOKEN.
// The visitor is not signed in and never will be: they are a bookkeeper who saw a post and wanted to say something.
// So this door is open, and what it accepts is one short answer with a contact in it - the same thing a person would type into a WhatsApp message.
// The origin allowlist is the only gate: a page served from our own site may post, and a script from anywhere else may not read the answer back.

// THE NEWEST ANSWER WINS.
// A bookkeeper who answers twice - once from a phone, once from the desk - is one person with one need, not two leads.
// So the contact is the identity, and the second answer replaces the first, keeping the first time we heard from them.

import "@supabase/edge-runtime";
import { createClient } from "@supabase/supabase-js";
import { CORS_DEFAULT_ORIGINS, resolveAllowedOrigin } from "../_shared/cors.ts";
import { requiredEnv } from "../_shared/required-env.ts";

const SUPABASE_URL = requiredEnv("SUPABASE_URL");
const SERVICE_ROLE_KEY = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const MAX_BODY_BYTES = 8000;
const LIMITS = Object.freeze({ name: 120, contact: 160, firm: 120, portal: 160, clients: 40, pain: 600 });

function response(req: Request, body: unknown, status: number, headers: Record<string, string> = {}) {
  const origin = resolveAllowedOrigin(req, CORS_DEFAULT_ORIGINS);
  // A 204 CARRIES NO BODY: the browser's preflight is answered with 204, and a 204 with a body is not a 204 - the edge runtime refuses to build it and the preflight answers 500, so the browser never sends the POST at all.
  // Measured on 2026-11-15: the pilot page's form failed in a real browser with "Gagal terkirim" while the same POST from a command line answered 201 - the preflight was the only thing between the visitor and the row.
  const empty = status === 204 || body === null;
  return new Response(empty ? null : JSON.stringify(body), {
    status,
    headers: {
      ...(empty ? {} : { "content-type": "application/json; charset=utf-8" }),
      ...(origin === null ? {} : { "access-control-allow-origin": origin, "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST, OPTIONS" }),
      "x-content-type-options": "nosniff",
      ...headers
    }
  });
}

// THE FIELDS ARE CUT TO A LENGTH: an answer is a sentence, not a document, and a field with no ceiling is a field that can hold anything.

function text(value: unknown, limit: number): string {
  return String(value ?? "").trim().slice(0, limit);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return response(req, null, 204);
  if (req.method !== "POST") return response(req, { ok: false, error: "This door takes a POST." }, 405);

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return response(req, { ok: false, error: "That answer is longer than the door accepts." }, 413);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return response(req, { ok: false, error: "The body was not JSON." }, 400);
  }
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return response(req, { ok: false, error: "The body was not an object." }, 400);
  }

  const name = text(payload.name, LIMITS.name);
  const contact = text(payload.contact, LIMITS.contact);
  if (!name || !contact) return response(req, { ok: false, error: "A name and a way to reply are needed." }, 400);

  const row = {
    name,
    contact,
    firm: text(payload.firm, LIMITS.firm) || null,
    portal: text(payload.portal, LIMITS.portal) || null,
    clients: text(payload.clients, LIMITS.clients) || null,
    pain: text(payload.pain, LIMITS.pain) || null,
    wants_slot: payload.wantsSlot === true,
    source: text(payload.source, 40) || "pilot-page",
    user_agent: text(req.headers.get("user-agent"), 200) || null,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("opera_feedback")
    .upsert(row, { onConflict: "contact" })
    .select("contact, updated_at")
    .single();

  if (error) return response(req, { ok: false, error: "The answer did not land." }, 500);
  return response(req, { ok: true, contact: data?.contact ?? contact, updatedAt: data?.updated_at ?? row.updated_at }, 201);
});
