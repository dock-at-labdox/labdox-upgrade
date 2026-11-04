import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";

const PATHS = ["/", "/explore-courses", "/discover-your-path"] as const;
const DOCUMENT_TYPES = new Set(["globalSettings", "intentPrompt"]);

function verifySignature(body: string, header: string | null, secret: string) {
  if (!header) return false;

  const timestampMatch = header.match(/(?:^|,)t=(\d+)(?:,|$)/);
  const signatureMatch = header.match(/(?:^|,)v1=([A-Za-z0-9_-]+)(?:,|$)/);
  if (!timestampMatch || !signatureMatch) return false;

  const timestamp = Number(timestampMatch[1]);
  if (!Number.isSafeInteger(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > 300) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest();

  const received = Buffer.from(signatureMatch[1], "base64url");
  return received.length === expected.length &&
    timingSafeEqual(received, expected);
}

export async function POST(request: Request) {
  const secret = process.env.CMS_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: "Webhook not configured." }, { status: 503 });
  }

  const body = await request.text();
  if (!verifySignature(body, request.headers.get("sanity-webhook-signature"), secret)) {
    return Response.json({ ok: false, error: "Invalid signature." }, { status: 401 });
  }

  let payload: { _type?: unknown; document?: { _type?: unknown } };
  try {
    payload = JSON.parse(body);
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const type = typeof payload._type === "string"
    ? payload._type
    : payload.document?._type;

  if (typeof type !== "string" || !DOCUMENT_TYPES.has(type)) {
    return Response.json({ ok: true, revalidated: false });
  }

  for (const path of PATHS) revalidatePath(path);

  return Response.json({ ok: true, revalidated: true, paths: PATHS });
}
