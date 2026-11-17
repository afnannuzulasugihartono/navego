// @last-edited: 2026-11-11 UTC+7.
// @title: navego-update — the update service: the manifest, the signed CRX and the newest build.
// @state: the two extension ids it answers, the update.xml it writes, and the CRX it serves.
// @dependencies: edge-runtime, supabase-js, cors.

import "@supabase/edge-runtime";
import { createClient } from "@supabase/supabase-js";
import { CORS_DEFAULT_ORIGINS, resolveAllowedOrigin } from "../_shared/cors.ts";
import { requiredEnv } from "../_shared/required-env.ts";

const SUPABASE_URL = requiredEnv("SUPABASE_URL");
const SERVICE_ROLE_KEY = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const LEGACY_EXTENSION_ID = "pagjlnohdemoohcncicjmaejedcmcocm";
const CURRENT_EXTENSION_ID = "ofgemipoobcnbjkfanmofjbdonjapmgl";

const EXTENSION_ID_PATTERN = /^[a-p]{32}$/;

const CRX_MAGIC = "Cr24";
const CRX_PREFIX_BYTES = 12;

function response(req: Request, body: BodyInit | null, status: number, headers: Record<string,string>) {

  const origin = resolveAllowedOrigin(req, CORS_DEFAULT_ORIGINS);
  return new Response(body, {
    status,
    headers: {
      ...(origin === null ? {} : { "Access-Control-Allow-Origin": origin }),
      "X-Content-Type-Options": "nosniff",
      ...headers
    }
  });
}

async function sha256Hex(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes as unknown as ArrayBuffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function bytesFromBase64(value: string) {
  const raw = atob(value);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function zipPayloadOf(crx: Uint8Array): Uint8Array | null {
  if (crx.length < CRX_PREFIX_BYTES + 4) return null;
  const magic = new TextDecoder().decode(crx.subarray(0, 4));
  if (magic !== CRX_MAGIC) return null;
  const view = new DataView(crx.buffer, crx.byteOffset, crx.byteLength);
  const headerLength = view.getUint32(8, true);
  const start = CRX_PREFIX_BYTES + headerLength;
  if (start >= crx.length) return null;

  if (crx[start] !== 0x50 || crx[start + 1] !== 0x4b) return null;
  return crx.subarray(start);
}

function requestedExtensionId(url: URL) {

  const nested = new URLSearchParams(url.searchParams.get("x") ?? "");
  const candidate = nested.get("id") ?? url.searchParams.get("id");
  if (candidate === null) return LEGACY_EXTENSION_ID;
  return EXTENSION_ID_PATTERN.test(candidate) ? candidate : null;
}

// WHY THE SHIPPED MANIFEST'S UPDATE_URL HAS NO ID.
// The Update button and the first external-install check ask from that bare URL, and the browser's own request carries its appid inside x.
// Reading both means a caller that names itself gets its own answer, and a caller that names nobody hears about every app we serve instead of only the legacy one.

function askedExtensionIds(url: URL): string[] {
  const ids = new Set<string>();
  const nested = new URLSearchParams(url.searchParams.get("x") ?? "");
  for (const candidate of [nested.get("id"), url.searchParams.get("id")]) {
    if (candidate === null) continue;
    if (!EXTENSION_ID_PATTERN.test(candidate)) return [];
    ids.add(candidate);
  }
  const chromeRequest = String(url.searchParams.get("x") ?? "");
  const fromChrome = chromeRequest.match(/appid=["']?([a-p]{32})/i)?.[1];
  if (fromChrome) ids.add(fromChrome);
  return [...ids];
}

async function activeRelease(extensionId: string) {
  const { data, error } = await supabase
    .from("opera_releases")
    .select("version, extension_id, crx_base64, sha256")
    .eq("active", true)
    .eq("extension_id", extensionId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function logUpdateEvent(
  requestKind: "update_xml" | "crx",
  req: Request,
  release: { version: string; sha256: string },
  url: URL
) {
  const userAgent = req.headers.get("user-agent");
  const accept = req.headers.get("accept");
  const { error } = await supabase.from("opera_update_events").insert({
    request_kind: requestKind,
    method: req.method,
    path: url.pathname.slice(0, 1000),
    query_string: url.search.slice(0, 2000),
    served_version: release.version,
    release_sha256: release.sha256,
    user_agent: userAgent ? userAgent.slice(0, 512) : null,
    accept_header: accept ? accept.slice(0, 512) : null
  });
  if (error) console.warn("navego-update telemetry", error.message);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return response(req, "Method Not Allowed", 405, { "Allow": "GET, HEAD" });
  }
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const base = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/navego-update`;

    if (path.endsWith("/update.xml")) {
      const asked = askedExtensionIds(url);
      const ids = asked.length ? asked : [LEGACY_EXTENSION_ID, CURRENT_EXTENSION_ID];
      const releases = (await Promise.all(ids.map(activeRelease))).filter(
        (candidate): candidate is NonNullable<typeof candidate> => candidate !== null
      );
      if (!releases.length) return response(req, "No active release for extension ID", 404, { "Content-Type": "text/plain; charset=utf-8" });
      await logUpdateEvent("update_xml", req, releases[0], url);
      const apps = releases.map((release) => `  <app appid="${release.extension_id}">\n    <updatecheck codebase="${base}/navego-${release.extension_id}-${release.version}.crx" version="${release.version}" />\n  </app>`).join("\n");
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">\n${apps}\n</gupdate>\n`;
      return response(req, req.method === "HEAD" ? null : xml, 200, {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "no-store, max-age=0"
      });
    }

    if (path.endsWith("/download/navego.crx") || path.endsWith("/download/navego.zip")) {
      const wantsZip = path.endsWith("/download/navego.zip");
      const current = await activeRelease(CURRENT_EXTENSION_ID);
      if (!current) return response(req, "No active release for extension ID", 404, { "Content-Type": "text/plain; charset=utf-8" });

      await logUpdateEvent("crx", req, current, url);
      const bytes = wantsZip
        ? zipPayloadOf(bytesFromBase64(current.crx_base64))
        : bytesFromBase64(current.crx_base64);
      if (!bytes) return response(req, "Release payload is not a zip", 500, { "Content-Type": "text/plain; charset=utf-8" });
      // WHY THE READER'S BROWSER IS IN THE FILE NAME.
      // A person who drives two browsers downloads the build twice, and two files with the same name in the downloads folder are two files they cannot tell apart.
      // The name carries the browser and the version, so the folder each one lands in says which browser it belongs to.
      const wanted = String(url.searchParams.get("for") ?? "").trim().toLowerCase();
      const browser = /^[a-z][a-z0-9]{1,11}$/.test(wanted) ? wanted : "";
      const filename = `navego${browser ? `-${browser}` : ""}-${current.version}${wantsZip ? ".zip" : ".crx"}`;
      // WHY THE VERSION IS READABLE FROM ANOTHER ORIGIN: the extension's self-update decides from this one header, and a browser hides headers the server did not name as visible - so the version it carries may not land in the caller's hands without saying so here.
      return response(req, req.method === "HEAD" ? null : new Uint8Array(bytes).buffer, 200, {
        "Content-Type": wantsZip ? "application/zip" : "application/x-chrome-extension",
        "Content-Length": String(bytes.byteLength),
        "Access-Control-Expose-Headers": "X-Opera-Version",

        "Cache-Control": "no-store, max-age=0",

        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Opera-Version": current.version,

        "X-Opera-Sha256": await sha256Hex(bytes)
      });
    }

    const identityCrxMatch = path.match(/\/navego-([a-p]{32})-([0-9]+\.[0-9]+\.[0-9]+)\.crx$/);
    const extensionId = identityCrxMatch?.[1] ?? requestedExtensionId(url);
    if (!extensionId) return response(req, "Invalid extension ID", 400, { "Content-Type": "text/plain; charset=utf-8" });
    const release = await activeRelease(extensionId);
    if (!release) return response(req, "No active release for extension ID", 404, { "Content-Type": "text/plain; charset=utf-8" });
    if (identityCrxMatch && identityCrxMatch[2] !== release.version) {
      return response(req, "Release not found", 404, { "Content-Type": "text/plain; charset=utf-8" });
    }

    const identityCrxPath = `/navego-${release.extension_id}-${release.version}.crx`;
    const legacyCrxPath = release.extension_id === LEGACY_EXTENSION_ID
      ? `/navego-${release.version}.crx`
      : null;
    if (path.endsWith(identityCrxPath) || (legacyCrxPath !== null && path.endsWith(legacyCrxPath))) {
      await logUpdateEvent("crx", req, release, url);
      const bytes = bytesFromBase64(release.crx_base64);
      return response(req, req.method === "HEAD" ? null : bytes, 200, {
        "Content-Type": "application/x-chrome-extension",
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "ETag": `"${release.sha256}"`
      });
    }

    if (path.endsWith("/health") || path.endsWith("/navego-update") || path.endsWith("/")) {
      const body = JSON.stringify({
        ok: true,
        product: "Navego",
        version: release.version,
        extensionId: release.extension_id,
        sha256: release.sha256,
        passiveUpdateTelemetry: true
      });
      return response(req, req.method === "HEAD" ? null : body, 200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      });
    }

    return response(req, "Not Found", 404, { "Content-Type": "text/plain; charset=utf-8" });
  } catch (error) {
    console.error("navego-update", error instanceof Error ? error.message : String(error));
    return response(req, "Update service error", 500, { "Content-Type": "text/plain; charset=utf-8" });
  }
});
