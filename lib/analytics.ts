import { prisma } from "@/lib/db";

export const ANALYTICS_EVENT_TYPES = [
  "PAGE_VIEW",
  "PRODUCT_VIEW",
  "SEARCH",
  "ADD_TO_CART",
  "CHECKOUT_START",
  "PURCHASE",
  "CUSTOM",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export function deviceFromUserAgent(ua: string | null | undefined): string {
  if (!ua) return "unknown";
  if (/mobile|android|iphone|ipad/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

export async function trackEvent(params: {
  type: AnalyticsEventType | string;
  sessionId?: string | null;
  userId?: string | null;
  path?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  device?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        type: params.type,
        sessionId: params.sessionId ?? null,
        userId: params.userId ?? null,
        path: params.path ?? null,
        referrer: params.referrer ?? null,
        utmSource: params.utmSource ?? null,
        utmMedium: params.utmMedium ?? null,
        utmCampaign: params.utmCampaign ?? null,
        device: params.device ?? null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (error) {
    console.error("[analytics:error]", error);
  }
}
