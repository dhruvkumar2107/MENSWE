import type { NextRequest } from "next/server";
import { deviceFromUserAgent, trackEvent, ANALYTICS_EVENT_TYPES } from "@/lib/analytics";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  const limiter = rateLimit(`analytics:${ip}`, 120, 60_000);
  if (!limiter.allowed) return new Response(null, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const type = String(body.type || "CUSTOM");
  if (!ANALYTICS_EVENT_TYPES.includes(type as (typeof ANALYTICS_EVENT_TYPES)[number]) && type !== "CUSTOM") {
    return new Response(null, { status: 400 });
  }

  await trackEvent({
    type,
    sessionId: body.sessionId ? String(body.sessionId) : null,
    path: body.path ? String(body.path) : null,
    referrer: body.referrer ? String(body.referrer) : null,
    utmSource: body.utmSource ? String(body.utmSource) : null,
    utmMedium: body.utmMedium ? String(body.utmMedium) : null,
    utmCampaign: body.utmCampaign ? String(body.utmCampaign) : null,
    device: deviceFromUserAgent(request.headers.get("user-agent")),
    metadata: typeof body.metadata === "object" && body.metadata ? (body.metadata as Record<string, unknown>) : undefined,
  });

  return new Response(null, { status: 204 });
}
