import { Hono } from "hono";
import type { Env } from "./types";
import { resolveRoute } from "./routes";

// Re-export workflow class — Cloudflare requires workflow classes to be
// exported from the Worker's main module (src/index.ts).
export { GitHubEventWorkflow } from "./workflows/github-event";

const app = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// GET / — health check
// ---------------------------------------------------------------------------
app.get("/", (c) => {
  return c.json({ service: "minhagent-webhook", status: "ok" });
});

// ---------------------------------------------------------------------------
// POST /webhook — GitHub App webhook receiver
// ---------------------------------------------------------------------------
app.post("/webhook", async (c) => {
  // 1. Read the raw body first (needed for HMAC verification).
  const rawBody = await c.req.arrayBuffer();

  // 2. Verify X-Hub-Signature-256.
  const signatureHeader = c.req.header("X-Hub-Signature-256");
  if (!signatureHeader) {
    return c.json({ error: "Missing X-Hub-Signature-256" }, 401);
  }

  const secret = c.env.GITHUB_WEBHOOK_SECRET;
  const isValid = await verifySignature(rawBody, signatureHeader, secret);
  if (!isValid) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  // 3. Read GitHub-specific headers.
  const ghEvent = c.req.header("X-GitHub-Event") ?? "unknown";
  const deliveryId = c.req.header("X-GitHub-Delivery") ?? crypto.randomUUID();
  // X-GitHub-Hook-Installation-Target-ID — available for reference/logging.
  const hookTargetId = c.req.header("X-GitHub-Hook-Installation-Target-ID");

  // 4. Parse JSON payload, extract summary fields (never log full payload).
  let action: string | null = null;
  let repo: string | null = null;
  let sender: string | null = null;
  let installation: number | null = null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(rawBody)) as Record<
      string,
      unknown
    >;
    action = typeof payload.action === "string" ? payload.action : null;
    repo =
      typeof (payload.repository as Record<string, unknown>)?.full_name ===
      "string"
        ? ((payload.repository as Record<string, unknown>).full_name as string)
        : null;
    sender =
      typeof (payload.sender as Record<string, unknown>)?.login === "string"
        ? ((payload.sender as Record<string, unknown>).login as string)
        : null;
    installation =
      typeof (payload.installation as Record<string, unknown>)?.id === "number"
        ? ((payload.installation as Record<string, unknown>).id as number)
        : null;
  } catch {
    return c.json({ error: "Invalid JSON payload" }, 400);
  }

  // 5. Structured log of every event.
  console.log(
    JSON.stringify({
      level: "info",
      msg: "github_webhook_received",
      deliveryId,
      event: ghEvent,
      action,
      repo,
      sender,
      installation,
      hookTargetId,
    })
  );

  // 6. Route to a workflow if matched.
  const route = resolveRoute(ghEvent, action);
  if (route) {
    const payloadSummary = { repo, sender, installation };

    try {
      await c.env.GITHUB_EVENT_WORKFLOW.create({
        id: deliveryId,
        params: { event: ghEvent, action, deliveryId, payloadSummary },
      });
    } catch (err: unknown) {
      // Treat "instance already exists" as a duplicate delivery — idempotent 200.
      const msg =
        err instanceof Error ? err.message.toLowerCase() : String(err);
      if (!msg.includes("already exists") && !msg.includes("duplicate")) {
        // Unexpected error — rethrow so the platform surfaces it.
        throw err;
      }
      console.log(
        JSON.stringify({
          level: "info",
          msg: "duplicate_delivery_ignored",
          deliveryId,
        })
      );
    }
  }

  // 7. Respond 202 quickly — processing is async.
  return c.json({ ok: true, deliveryId }, 202);
});

// ---------------------------------------------------------------------------
// HMAC-SHA256 signature verification (Web Crypto, timing-safe)
// ---------------------------------------------------------------------------
async function verifySignature(
  body: ArrayBuffer,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  // Header format: "sha256=<hex>"
  const prefix = "sha256=";
  if (!signatureHeader.startsWith(prefix)) return false;
  const expectedHex = signatureHeader.slice(prefix.length);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    body
  );

  const computedHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Timing-safe comparison: compare byte arrays via crypto.subtle.timingSafeEqual
  // if available (Workers runtime exposes it), otherwise fall back to a
  // constant-time loop that never short-circuits.
  const computedBytes = new Uint8Array(signatureBuffer);
  const expectedBytes = hexToBytes(expectedHex);

  if (computedBytes.length !== expectedBytes.length) return false;

  if (typeof crypto.subtle.timingSafeEqual === "function") {
    return crypto.subtle.timingSafeEqual(computedBytes, expectedBytes);
  }

  // Fallback: constant-time loop (no early return on mismatch).
  let diff = 0;
  for (let i = 0; i < computedBytes.length; i++) {
    diff |= (computedBytes[i] ?? 0) ^ (expectedBytes[i] ?? 0);
  }
  void computedHex; // suppress unused var
  return diff === 0;
}

function hexToBytes(hex: string): Uint8Array {
  const len = hex.length;
  const bytes = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

export default app;
